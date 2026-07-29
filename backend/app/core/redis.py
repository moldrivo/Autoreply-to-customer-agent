from __future__ import annotations

import hashlib
import json
import logging
from functools import wraps
from typing import Any, Callable, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_pool = None


async def close_redis():
    global _redis_pool
    if _redis_pool is not None:
        try:
            await _redis_pool.close()
        except Exception:
            pass
        _redis_pool = None


async def get_redis():
    global _redis_pool
    try:
        import redis.asyncio as aredis

        if _redis_pool is None:
            _redis_pool = aredis.from_url(
                settings.compute_redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            await _redis_pool.ping()
        return _redis_pool
    except Exception as exc:
        logger.warning("Redis unavailable: %s — using null cache", exc)
        return None


async def cache_get(key: str) -> Optional[Any]:
    r = await get_redis()
    if r is None:
        return None
    try:
        val = await r.get(key)
        if val is not None:
            return json.loads(val)
    except Exception as exc:
        logger.warning("Cache get failed for key=%s: %s", key, exc)
    return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as exc:
        logger.warning("Cache set failed for key=%s: %s", key, exc)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.delete(key)
    except Exception as exc:
        logger.warning("Cache delete failed for key=%s: %s", key, exc)


def _make_cache_key(prefix: str, args: tuple, kwargs: dict) -> str:
    parts = [prefix]
    if args:
        parts.append(repr(args))
    if kwargs:
        kw_sorted = sorted(kwargs.items())
        parts.append(repr(kw_sorted))
    raw = ":".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def cached(key_prefix: str, ttl: int = 300):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache_key = _make_cache_key(key_prefix, args, kwargs)
            cached_val = await cache_get(cache_key)
            if cached_val is not None:
                return cached_val
            result = await func(*args, **kwargs)
            await cache_set(cache_key, result, ttl=ttl)
            return result

        return wrapper

    return decorator
