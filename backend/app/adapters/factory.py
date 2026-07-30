from typing import Any
from app.adapters.base import BasePlatformAdapter
from app.adapters.email_adapter import EmailAdapter
from app.adapters.google_adapter import GoogleAdapter
from app.adapters.facebook_adapter import FacebookAdapter
from app.adapters.trustpilot_adapter import TrustpilotAdapter
from app.adapters.yelp_adapter import YelpAdapter
from app.adapters.shopify_adapter import ShopifyAdapter
from app.adapters.amazon_adapter import AmazonAdapter
from app.adapters.app_store_adapter import AppStoreAdapter
from app.adapters.play_store_adapter import PlayStoreAdapter
from app.adapters.airbnb_adapter import AirbnbAdapter
from app.adapters.booking_adapter import BookingAdapter

_adapter_registry: dict[str, type[BasePlatformAdapter]] = {
    "email": EmailAdapter,
    "google": GoogleAdapter,
    "facebook": FacebookAdapter,
    "trustpilot": TrustpilotAdapter,
    "yelp": YelpAdapter,
    "shopify": ShopifyAdapter,
    "amazon": AmazonAdapter,
    "app_store": AppStoreAdapter,
    "play_store": PlayStoreAdapter,
    "airbnb": AirbnbAdapter,
    "booking": BookingAdapter,
}


def get_adapter(platform: str, config: dict[str, Any] | None = None) -> BasePlatformAdapter:
    """Return an adapter instance for the given platform."""
    adapter_class = _adapter_registry.get(platform.lower())
    if not adapter_class:
        raise ValueError(
            f"Unsupported platform: {platform}. Supported: {list(_adapter_registry.keys())}"
        )
    return adapter_class(config)


def get_supported_platforms() -> list[str]:
    """Return a list of all registered platform keys."""
    return list(_adapter_registry.keys())


def register_adapter(platform: str, adapter_class: type[BasePlatformAdapter]) -> None:
    """Register a custom adapter for a platform."""
    _adapter_registry[platform] = adapter_class
