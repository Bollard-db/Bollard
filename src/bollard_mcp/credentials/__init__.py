from __future__ import annotations

import logging
from ..config import get_settings
from .keyring_store import CredentialStore as KeyringStore
from .encrypted_store import EncryptedCredentialStore

logger = logging.getLogger(__name__)


class CredentialStore:
    """
    Unified credential store that automatically selects the backend
    based on configuration and availability.
    """

    def __init__(self) -> None:
        settings = get_settings()
        backend = settings.credential_backend.lower()

        self._store: KeyringStore | EncryptedCredentialStore

        if backend == "keyring":
            self._store = KeyringStore()
            logger.debug("Using forced OS Keyring credential store.")
        elif backend == "encrypted":
            self._store = EncryptedCredentialStore()
            logger.debug("Using forced encrypted file credential store.")
        else:  # "auto"
            keyring_store = KeyringStore()
            if keyring_store.is_available():
                self._store = keyring_store
                logger.debug("OS Keyring detected and verified. Using keyring store.")
            else:
                self._store = EncryptedCredentialStore()
                logger.warning("OS Keyring unavailable. Falling back to encrypted file store.")

    def save(self, alias: str, connection_string: str) -> None:
        """Store a connection string under the given alias."""
        self._store.save(alias, connection_string)

    def retrieve(self, alias: str) -> str | None:
        """Retrieve a connection string by alias."""
        return self._store.retrieve(alias)

    def delete(self, alias: str) -> None:
        """Remove a stored credential."""
        self._store.delete(alias)

    def is_available(self) -> bool:
        """Check if the selected backend is functional."""
        return self._store.is_available()


__all__ = ["CredentialStore"]
