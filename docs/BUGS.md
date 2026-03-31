---
markup_reviewed: true
markup_reviewed_at: "2026-03-31T11:43:55.347Z"
markup_status: "changes_requested"
---
# Markup — Bugs, Improvements & Feature Requests
<!-- @markup {"id":"GHXds3_5j7Hn_fJDiCxQP","type":"inline","anchor":"h1:Markup — Bugs, Improvements & Feature Requests","author":"","ts":"2026-03-31T11:30:38.092Z"} Ok - let's see -->

## Open

### Bug: Tab switching doesn't preserve scroll position

- **Reported:** 2026-03-29
- When switching between tabs, the scroll position is lost. Each tab should remember where the user was.

### Improvement: Add border below macOS window buttons

- **Reported:** 2026-03-31
- Add a visible border/divider below the macOS traffic light buttons, above the sidebars and tab bar/main panel, to visually separate the title bar region.

### Feature: Settings screen with settings button

- **Reported:** 2026-03-31
- Add a settings (gear) button in the top-right corner. Create a settings screen with basic app settings. Includes ability to select between macOS app icons (black background vs vivid background).

### Improvement: Group recent files by date

- **Reported:** 2026-03-31
- In the Recent tab, group files by relative date buckets (Today, Yesterday, This Week, This Month, Older) instead of showing individual "2 hours ago" timestamps next to each file.

### Improvement: File path tooltip on hover

- **Reported:** 2026-03-31
- When hovering a file in the Files sidebar, Recent tab, or open tabs, show a tooltip with the full absolute path to that file.

### Improvement: Unify sidebar toggle components

- **Reported:** 2026-03-31
- Make the Files/Recent toggle and the Review/Edit toggle use the same component with the same sizing for visual consistency. Also make the Save button the same height as the Review/Edit toggle.

## Resolved

### Feature: Persist last used folder(s) across sessions

- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Workspace settings (folders, sidebar mode) persisted to `markup-settings.json` via Electron's userData path. App restores previous workspace on launch.
- **Commit:** 82a8214

### Feature: Multiple working folders in sidebar

- **Reported:** 2026-03-29
- **Fixed:** 2026-03-29 — Multi-folder workspace with add/remove. Each folder shown as a separate root in the file tree. Recent files view shows files across all folders sorted by mtime.
- **Commit:** 5013cd6

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