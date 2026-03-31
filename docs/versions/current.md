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

## Known Issues

### Bugs
1. **Tab switching doesn't preserve scroll position** — each tab should remember where the user was
2. **`-->` in comment body breaks serialization** — prematurely closes the HTML comment
3. **Duplicate heading IDs** — outline click scrolls to first match only
4. **Anchor mismatch after heading edit** — comment may misplace after heading text changes
5. **No error handling on deleted file select** — unhandled rejection if file is deleted between listing and clicking
6. **Outline scroll doesn't work in edit mode** — queries `.review-mode` DOM which doesn't exist

### Missing UX
7. **No unsaved-changes prompt on file switch** — switching files discards unsaved comments silently
8. **Save failure is silent** — no error UI when write fails
9. **External change with unsaved work** — reload loses unsaved comments with no warning

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

<!-- @markup-doc-comments
{"id":"0nk1m8osv2HbGgJg6BYwi","type":"document","author":"","ts":"2026-03-31T10:44:11.279Z","body":"We should keep provenance of previous comments and changes that were made in frontmatter or ideally at the very end of the document (for readability in other readers). The section should be very clearly labeled as feedback that was addressed. The claude skill should probably know as well that provenance data is from previous iterations."}
{"id":"WluA0eVx4G9ARlKWvs79H","type":"document","author":"","ts":"2026-03-31T10:45:10.252Z","body":"Let's make the Save button more outspoken as well. right now its an outline button, I think its should be a solid button in primary color."}
{"id":"SWc5NygQaAgB-kgJmoSh7","type":"document","author":"","ts":"2026-03-31T10:46:03.701Z","body":"Let's add a UI kit/color scheme to the repo as well."}
{"id":"kuoltoZxt9H9wSsBar04w","type":"document","author":"","ts":"2026-03-31T10:47:15.973Z","body":"In the Files tab, let's add the repo branch next to each top level folder (if its a repo)"}
{"id":"oE-3MljQFvD4yMye3oPrE","type":"document","author":"","ts":"2026-03-31T10:48:04.237Z","body":"Update the title for \"Document Outline\" panel, remove the \"•\""}
{"id":"O39upY4yOcc0Q6MRznTKq","type":"document","author":"","ts":"2026-03-31T10:49:52.111Z","body":"We need a CLI as well to open files in Markup"}
{"id":"PQuwGe0NePy866QUZhSc6","type":"document","author":"","ts":"2026-03-31T10:50:22.017Z","body":"Improvement: edit comments! Currently can only add and delete!"}
{"id":"WyfwLyQy3Y0uryO21d3lg","type":"document","author":"","ts":"2026-03-31T10:52:38.656Z","body":"After saving a file in Markup, the app immediately shows \"File was modified eternally\" message, File watching should ignore saves by markup!"}
-->