from __future__ import annotations

import importlib
import logging
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.platform import PlatformConnection
from app.models.review import Review
from app.utils.encryption import decrypt_value, encrypt_value
from app.utils.helpers import now

logger = logging.getLogger(__name__)


class PlatformService:
    def __init__(self, db: AsyncSession, config: Optional[dict[str, Any]] = None) -> None:
        self.db = db
        self.config = config or {}

    async def connect_platform(
        self, business_id: UUID, platform: str, credentials: dict[str, Any]
    ) -> PlatformConnection:
        access_token = credentials.get("access_token") or credentials.get("token", "")
        refresh_token = credentials.get("refresh_token", "")

        encrypted_access = encrypt_value(access_token) if access_token else None
        encrypted_refresh = encrypt_value(refresh_token) if refresh_token else None

        connection = PlatformConnection(
            id=uuid4(),
            business_id=business_id,
            platform=platform,
            platform_account_name=credentials.get("account_name", platform),
            platform_account_id=credentials.get("account_id"),
            encrypted_access_token=encrypted_access,
            encrypted_refresh_token=encrypted_refresh,
            token_expires_at=credentials.get("token_expires_at"),
            scopes=credentials.get("scopes", []),
            platform_metadata=credentials.get("metadata", {}),
            is_active=True,
        )
        self.db.add(connection)
        await self.db.flush()
        await self.db.refresh(connection)

        try:
            test_result = await self._test_connection(connection)
            if not test_result:
                connection.is_active = False
                await self.db.flush()
                raise ValueError(f"Failed to connect to {platform}: connectivity test failed")
        except Exception as exc:
            connection.is_active = False
            await self.db.flush()
            raise ValueError(f"Failed to connect to {platform}: {exc}") from exc

        return connection

    async def _test_connection(self, connection: PlatformConnection) -> bool:
        try:
            adapter = self._get_adapter(connection.platform)
            if adapter and hasattr(adapter, "verify_connection"):
                return await adapter.verify_connection(connection)
            return True
        except (ValueError, ImportError):
            logger.info("No adapter found for %s, skipping test", connection.platform)
            return True

    async def disconnect_platform(self, business_id: UUID, platform_id: UUID) -> bool:
        result = await self.db.execute(
            select(PlatformConnection).where(
                PlatformConnection.business_id == business_id,
                PlatformConnection.id == platform_id,
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            return False
        await self.db.delete(connection)
        await self.db.flush()
        return True

    async def get_connections(self, business_id: UUID) -> list[PlatformConnection]:
        result = await self.db.execute(
            select(PlatformConnection)
            .where(PlatformConnection.business_id == business_id)
            .order_by(PlatformConnection.created_at.desc())
        )
        return list(result.scalars().all())

    def _get_adapter(self, platform: str) -> Any:
        try:
            from app.adapters.factory import get_adapter
            return get_adapter(platform)
        except (ValueError, ImportError):
            try:
                module_path = f"app.adapters.{platform}_adapter"
                module = importlib.import_module(module_path)
                for name in dir(module):
                    obj = getattr(module, name)
                    if isinstance(obj, type) and name.endswith("Adapter"):
                        return obj(self.config)
                return None
            except ModuleNotFoundError:
                return None

    async def publish_to_platform(
        self,
        business_id: UUID,
        platform_id: UUID,
        review: Review,
        reply_text: str,
    ) -> Optional[str]:
        result = await self.db.execute(
            select(PlatformConnection).where(
                PlatformConnection.business_id == business_id,
                PlatformConnection.id == platform_id,
                PlatformConnection.is_active == True,
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            raise ValueError("Platform connection not found or inactive")

        adapter = self._get_adapter(connection.platform)
        if adapter and hasattr(adapter, "post_reply"):
            try:
                platform_reply_id = await adapter.post_reply(
                    connection=connection,
                    review_id=str(review.id) if review else "",
                    reply_text=reply_text,
                )
                connection.last_sync_at = now()
                await self.db.flush()
                return str(platform_reply_id)
            except Exception as exc:
                logger.error("Failed to publish to %s: %s", connection.platform, exc)
                raise ValueError(f"Failed to publish reply: {exc}") from exc
        else:
            logger.warning(
                "No adapter for %s, simulating publish. Reply: %s",
                connection.platform,
                reply_text[:100],
            )
            connection.last_sync_at = now()
            await self.db.flush()
            return f"simulated-{uuid4()}"
