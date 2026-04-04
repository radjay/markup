---
title: "Markup v0.1 — Current State"
version: "0.1.0"
date: "2026-03-30"
status: "shipped"
markup_reviewed: true
markup_reviewed_at: "2026-03-31T10:52:40.264Z"
markup_status: "commented"
---
# Markup v0.1 — Current State

Native macOS markdown editor for reviewing AI-generated plans and documents. Built with Electron 41, React 19, and TypeScript. Shipped 2026-03-30.

## Core Features

### Review Workflow
- Open `.md` files via File dialog (Cmd+O), sidebar click, or drag-and-drop
- Rendered markdown with Literata headings, Inter body, JetBrains Mono code, dark theme
- Full GFM support: tables, strikethrough, task lists, autolinks
- Click any block element (h1-h3, paragraph, list, table, code block, blockquote) to leave inline comments
- Document-level comments panel for general feedback
- Comments serialized as invisible HTML `` comments
- Frontmatter metadata: `markup_reviewed`, `markup_reviewed_at`, `markup_status`
- Unsaved changes indicator (dot on tab, highlighted Save button)

### Workspace & Navigation
- Multi-folder workspace with persistence across sessions
- Two sidebar modes: Files (tree view) and Recent (sorted by mtime, auto-refreshing)
- Git-aware: shows repo name, branch, and relative path in recent files
- Tabbed editor with VS Code-style preview mode (single-click = preview, double-click = pin)
- Cmd+W to close tabs
- Document outline in right panel (h1-h3, click to smooth-scroll)
- Drag-and-drop files and folders onto the app
- `.gitignore` respected in file tree; dotfiles, `node_modules`, `out/`, `dist/`, `release/` hidden

### Editing
- Toggle between Review and Edit mode (Cmd+E)
- CodeMirror 6 with markdown syntax highlighting and custom dark theme
- Edits and comments coexist — comments survive mode toggle
- Save from either mode (Cmd+S)

### File Watching
- chokidar 5 watches all workspace folders for `.md` changes
- "Modified externally" bar with Reload/Dismiss when open file changes
- Live sidebar refresh when new `.md` files appear or are removed

### Agent Integration
- Claude Code plugin (`plugin/CLAUDE.md` and `plugin/skill.md`)
- Comment format designed for machine parsing by coding agents
- Review status in frontmatter for programmatic access
- Agent can parse inline comments by anchor, document comments from block at EOF

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Cmd+O | Open file |
| Cmd+Shift+O | Open folder |
| Cmd+S | Save |
| Cmd+E | Toggle review/edit mode |
| Cmd+W | Close tab |
| Cmd+Enter | Submit comment |
| Escape | Close comment panel |

## Architecture

~2,400 lines of TypeScript across 22 source files. Clean three-process Electron split:

- **Main process:** Window management, file I/O, folder watching (chokidar 5), settings persistence
- **Preload:** Secure IPC bridge via `contextBridge`
- **Renderer:** React 19 with 4 custom hooks (`useWorkspace`, `useTabs`, `useActiveDocument`, `useAppEvents`) and atomic layout components
- **Shared:** TypeScript types and IPC channel constants

Settings stored as JSON at `~/Library/Application Support/markup/markup-settings.json`.

## Known Issues (v0.1)

All v0.1 known issues have been resolved. See below for what was fixed.

### Fixed Bugs
1. ~~**Tab switching doesn't preserve scroll position**~~ — scroll position now stored per tab and restored on switch
2. ~~**`-->` in comment body breaks serialization**~~ — `-->` escaped as `--&gt;` on serialize, unescaped on parse
3. ~~**Duplicate heading IDs**~~ — outline now disambiguates duplicate headings with counters
4. ~~**Anchor mismatch after heading edit**~~ — fallback positional anchoring when heading text changes
5. ~~**No error handling on deleted file select**~~ — try/catch with user alert on error
6. ~~**Outline scroll doesn't work in edit mode**~~ — CodeMirror line-based scroll fallback added

### Fixed UX
7. ~~**No unsaved-changes prompt on file switch**~~ — confirmation dialog when switching away from dirty tab
8. ~~**Save failure is silent**~~ — save errors now show inline error banner with dismiss
9. ~~**External change with unsaved work**~~ — reload warns about discarding unsaved changes

## Tech Stack

| Component | Version |
|-----------|---------|
| Electron | 41 |
| React | 19 |
| TypeScript | 5.6 |
| electron-vite | 5 |
| Vite | 6 |
| CodeMirror | 6 |
| chokidar | 5 |
| lucide-react | latest |
| react-markdown + remark-gfm + rehype-raw | latest |
| electron-builder | 26.8.1 |

## Packaging

- macOS DMG only (v0.1 target platform)
- App ID: `com.markup.app`
- Icon: `assets/icon.icns`
- Build: `npm run dist`

## Addressed Feedback (from v0.1 review)

The following document-level feedback was left during the v0.1 review and has since been addressed:

1. ~~Save button prominence~~ — Save button is now solid primary color when unsaved changes exist
2. ~~UI kit / color scheme~~ — Created `docs/ui-kit.md` with full design system documentation
3. ~~Git branch on folder headers~~ — Branch name shown next to top-level folders in Files sidebar
4. ~~Document Outline title dot~~ — Leading bullet removed from panel title
5. ~~Edit comments~~ — Inline and document-level comments now editable via pencil icon
6. ~~File watching triggers on self-save~~ — Self-saves suppressed via timestamp tracking (2s window)

**Still open (tracked in RAD Issues):**
- Comment provenance/history — resolved comments not yet archived (RAD-15)
- CLI to open files from terminal (RAD-14)