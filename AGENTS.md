# Bollard MCP Development Guide

This guide details command references, code styles, and architecture instructions for AI coding assistants working on the Bollard MCP repository.

## Commands

### Environment Setup
* Install in editable mode with all optional dependencies:
  ```bash
  pip install -e .[dev,mongodb,ai]
  ```

### Development Execution
* Run the MCP server in debug/stdio mode:
  ```bash
  python -m bollard_mcp.server
  ```
* Test running SQL commands directly:
  ```bash
  python -m bollard_mcp.server --test
  ```

### Code Quality & Validation
* Run test suites:
  ```bash
  pytest
  ```
* Run linter (Ruff):
  ```bash
  ruff check .
  ```
* Run static type checking (MyPy):
  ```bash
  mypy src
  ```

---

## Coding Style & Guidelines

### Python Standards
* Use modern Python (>= 3.10) with strict type hints for all public APIs and functions.
* Use Pydantic v2 for configuration and data schemas (`pydantic-settings` for settings).
* Format imports using Ruff/ISort conventions (stdlib first, third-party next, local imports last).

### Database safety & MCP server conventions
* Always prioritize query safety: routing all SQL execution through intent analysis.
* Never execute destructive write operations (INSERT, UPDATE, DELETE, DROP) without initiating the human-in-the-loop PIN validation flow.
* Securely store all connection passwords and secrets in the OS Keyring using the `keyring` library; fallback to AES-256 encrypted local storage ONLY when keyring is unavailable.

### Codebase Formatting
* Keep headings and list elements clean and professional.
* Never include emoji characters in headers or lists.
* Maintain consistent single-quotes for string values except when matching raw SQL syntax.
