# Markup — Bugs, Improvements & Feature Requests

## Open

### Feature: Persist last used folder(s) across sessions
- **Reported:** 2026-03-29
- Save working folder(s) to disk so the app opens directly to the file tree instead of the welcome screen on next launch

### Feature: Multiple working folders in sidebar
- **Reported:** 2026-03-29
- Let the user add multiple working folders. The file sidebar shows files from all configured folders, each as a separate root.

### Bug: Tab switching doesn't preserve scroll position
- **Reported:** 2026-03-29
- When switching between tabs, the scroll position is lost. Each tab should remember where the user was.

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
- **Commit:** 6240372

### Improvement: Redesigned tab bar and layout
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Tabs moved below titlebar into editor area (Cursor-style). Active tab uses background instead of colored underline. "Modified externally" bar scoped to editor pane. Mode toggle and Save moved to tab bar right side.
- **Commit:** (this commit)

### Improvement: File watcher uses content hashing
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Replaced noisy fs.watch with content-hash comparison. Only notifies when actual content changes. Self-saves update hash to prevent false positives.
- **Commit:** (this commit)

### Improvement: Outline moved to right panel, collapsed by default
- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Document outline moved from sidebar to right comments panel. Collapsed by default, click to expand.
- **Commit:** (this commit)
