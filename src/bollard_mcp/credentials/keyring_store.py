from __future__ import annotations

"""
OS Keyring credential store (primary).

Uses the system keyring for secure credential storage:
- macOS   → Keychain
- Windows → Credential Manager
- Linux   → Secret Service (libsecret / GNOME Keyring / KWallet)

Falls back to encrypted file storage if keyring is unavailable.
"""

import keyring
import keyring.errors

KEYRING_SERVICE = "bollard-mcp"


class CredentialStore:
    """
    Primary credential store using the OS native keyring.
    """

    def save(self, alias: str, connection_string: str) -> None:
        """Store a connection string under the given alias."""
        try:
            keyring.set_password(KEYRING_SERVICE, alias, connection_string)
        except keyring.errors.KeyringError as e:
            raise RuntimeError(f"OS Keyring unavailable: {e}. Use encrypted fallback.") from e

    def retrieve(self, alias: str) -> str | None:
        """Retrieve a connection string by alias. Returns None if not found."""
        try:
            return keyring.get_password(KEYRING_SERVICE, alias)
        except keyring.errors.KeyringError:
            return None

    def delete(self, alias: str) -> None:
        """Remove a stored credential."""
        try:
            keyring.delete_password(KEYRING_SERVICE, alias)
        except (keyring.errors.KeyringError, keyring.errors.PasswordDeleteError):
            pass  # Non-fatal if it doesn't exist

    def is_available(self) -> bool:
        """Check if OS keyring is functional on this system."""
        try:
            # Write and read back a test value
            keyring.set_password(KEYRING_SERVICE, "__test__", "ok")
            val = keyring.get_password(KEYRING_SERVICE, "__test__")
            keyring.delete_password(KEYRING_SERVICE, "__test__")
            return val == "ok"
        except Exception:
            return False
