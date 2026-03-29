# Markup — Bugs, Improvements & Feature Requests

## Open

### Feature: Persist last used folder(s) across sessions
- **Reported:** 2026-03-29
- Save working folder(s) to disk so the app opens directly to the file tree instead of the welcome screen on next launch

### Feature: Multiple working folders in sidebar
- **Reported:** 2026-03-29
- Let the user add multiple working folders. The file sidebar shows files from all configured folders, each as a separate root.


## Resolved

### Improvement: Welcome screen logo larger and brighter
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — SVG 80x50 → 120x75, color text-muted → text-secondary
- **Commit:** 9dcd634

### Bug: File watcher triggers "modified externally" after saving
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Unwatch file before save, re-watch after 1.5s delay
- **Commit:** 23628df

### Bug: Drag-and-drop doesn't work on welcome screen
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — `-webkit-app-region: drag` on `.welcome` was intercepting drop events. Replaced with a 52px pseudo-element drag region at top.
- **Commit:** b99b239

### Feature: Tabbed editor with VS Code-style preview mode
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Full tab system: single-click = preview (italic, replaced), double-click/edit/comment = pinned. Cmd+W to close. Multiple files open simultaneously.
- **Commit:** (this commit)
