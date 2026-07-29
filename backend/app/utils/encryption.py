from __future__ import annotations

import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from app.core.config import settings


def _derive_key(salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=600000)
    return base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))


def _get_or_create_salt() -> bytes:
    salt_path = "/tmp/autoreply_encryption_salt"
    if os.path.exists(salt_path):
        with open(salt_path, "rb") as f:
            return f.read()
    salt = os.urandom(16)
    os.makedirs(os.path.dirname(salt_path), exist_ok=True)
    with open(salt_path, "wb") as f:
        f.write(salt)
    return salt


_salt = _get_or_create_salt()
_fernet = Fernet(_derive_key(_salt))


def encrypt_value(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()
