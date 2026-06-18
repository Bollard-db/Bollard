from __future__ import annotations

"""
Fallback credential store using Fernet (AES-256) encryption.

Used when the OS native keyring is unavailable or disabled.
Stores encrypted connection strings in a JSON file:
~/.bollard/credentials.json

The encryption key is read from:
1. Environment variable BOLLARD_ENCRYPTION_KEY (recommended)
2. A locally generated key file at ~/.bollard/keys/bollard.key
"""

import json
import os
from pathlib import Path
from platformdirs import user_data_dir
from cryptography.fernet import Fernet
from ..config import get_settings


class EncryptedCredentialStore:
    """
    Fallback credential store using file-based Fernet AES-256 encryption.
    """

    def __init__(self) -> None:
        self._base_dir = Path(user_data_dir("bollard", "bollard"))
        self._creds_file = self._base_dir / "credentials.json"
        self._key_file = self._base_dir / "keys" / "bollard.key"
        self._fernet = self._init_fernet()

    def _init_fernet(self) -> Fernet:
        settings = get_settings()
        
        # 1. Check settings / env
        key_str = settings.encryption_key
        if key_str:
            try:
                return Fernet(key_str.encode("utf-8"))
            except Exception as e:
                raise ValueError(f"Invalid BOLLARD_ENCRYPTION_KEY format: {e}")

        # 2. Check local key file
        if self._key_file.exists():
            try:
                key_bytes = self._key_file.read_bytes()
                return Fernet(key_bytes)
            except Exception:
                pass  # If corrupt or unreadable, regenerate

        # 3. Generate new key
        key_bytes = Fernet.generate_key()
        try:
            self._key_file.parent.mkdir(parents=True, exist_ok=True)
            self._key_file.write_bytes(key_bytes)
            # Try to restrict file permissions to owner only (Unix-like systems)
            try:
                os.chmod(self._key_file, 0o600)
            except Exception:
                pass
        except Exception as e:
            # Fallback to in-memory/session-only key if write fails
            pass
        
        return Fernet(key_bytes)

    def save(self, alias: str, connection_string: str) -> None:
        """Store a connection string under the given alias."""
        data = self._load_all()
        encrypted = self._fernet.encrypt(connection_string.encode("utf-8")).decode("utf-8")
        data[alias] = encrypted
        self._save_all(data)

    def retrieve(self, alias: str) -> str | None:
        """Retrieve a connection string by alias. Returns None if not found or decryption fails."""
        data = self._load_all()
        encrypted = data.get(alias)
        if not encrypted:
            return None
        try:
            decrypted = self._fernet.decrypt(encrypted.encode("utf-8")).decode("utf-8")
            return decrypted
        except Exception:
            return None

    def delete(self, alias: str) -> None:
        """Remove a stored credential."""
        data = self._load_all()
        if alias in data:
            del data[alias]
            self._save_all(data)

    def is_available(self) -> bool:
        """Always returns True, as file-based fallback is always available."""
        return True

    def _load_all(self) -> dict[str, str]:
        if not self._creds_file.exists():
            return {}
        try:
            return json.loads(self._creds_file.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _save_all(self, data: dict[str, str]) -> None:
        try:
            self._creds_file.parent.mkdir(parents=True, exist_ok=True)
            self._creds_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
            # Try to restrict permissions to owner only
            try:
                os.chmod(self._creds_file, 0o600)
            except Exception:
                pass
        except Exception:
            pass  # Failures here are non-fatal (best-effort saving)
