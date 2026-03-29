# Markup — Bugs, Improvements & Feature Requests

## Open

### Improvement: Welcome screen logo should be larger and brighter
- **Reported:** 2026-03-29
- Make the SVG logo 50% larger on the launch screen and increase fill intensity

### Feature: Persist last used folder(s) across sessions
- **Reported:** 2026-03-29
- Save working folder(s) to disk so the app opens directly to the file tree instead of the welcome screen on next launch

### Feature: Multiple working folders in sidebar
- **Reported:** 2026-03-29
- Let the user add multiple working folders. The file sidebar shows files from all configured folders, each as a separate root.

## Resolved

### Bug: File watcher triggers "modified externally" after saving
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Suppress file watcher during our own save using a ref flag with 1s debounce
- **Commit:** (this commit)
