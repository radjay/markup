# Markup — Bugs, Improvements & Feature Requests

## Open

_Nothing open._

## Resolved

### Bug: File watcher triggers "modified externally" after saving
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Suppress file watcher during our own save using a ref flag with 1s debounce
- **Commit:** (this commit)
