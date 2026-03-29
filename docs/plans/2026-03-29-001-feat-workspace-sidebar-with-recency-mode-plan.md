---
title: "feat: Workspace Sidebar with Folder Management and Recency Mode"
type: feat
status: active
date: 2026-03-29
markup_reviewed: true
markup_reviewed_at: "2026-03-29T22:50:57.955Z"
markup_status: approved
---

# Workspace Sidebar with Folder Management and Recency Mode

## Overview

Transform Markup's file sidebar from a single-directory browser into a persistent workspace panel with two modes:

1. **File Tree** — the current tree view, but supporting multiple watched folders with add/remove
2. **Recently Updated** — a recency-sorted list of markdown files across all watched folders, grouped by folder, with change badges and auto-refresh

Opening a standalone file (Cmd+O / drag-and-drop) should open it in a new tab without affecting the sidebar's folder configuration.

## Problem Statement / Motivation

Markup is designed to sit open while AI agents work — the user reviews plans as they're generated. The current sidebar has four problems:

1. **No persistence** — folders must be re-opened on every launch
2. **Single directory** — can only browse one folder at a time
3. **No recency awareness** — when an agent writes a new plan, the user has to manually find it in the tree
4. **No live refresh** — when new .md files are created or changed, the file panel doesn't update until manually refreshed

The "recently updated" mode is the killer feature: it turns the sidebar into a live feed of agent output. New/changed files bubble to the top with a badge. Zero-effort file discovery.

## Proposed Solution

### Settings Persistence

Use a plain JSON file at `app.getPath('userData')/markup-settings.json` to persist:

```typescript
interface WorkspaceSettings {
  folders: string[]
  sidebarMode: 'tree' | 'recent'
}
```

### Architecture

```
Main Process
├── settings.ts         — load/save settings JSON
├── folder-watcher.ts   — chokidar watchers for all folders
│   ├── emits file:added, file:changed, file:removed
│   └── provides listRecentFiles(folders) → sorted by mtime
└── index.ts            — IPC handlers wire everything together

Preload
└── index.ts            — expose settings + watcher APIs

Renderer
├── App.tsx             — manages folder list, sidebar mode
└── components/Sidebar/
    ├── FileTree.tsx     — existing tree (enhanced for multi-folder)
    ├── RecentFiles.tsx  — NEW: recency-sorted flat list grouped by folder
    └── SidebarHeader.tsx— NEW: mode toggle + add folder button
```

### IPC Channels (new)

```typescript
SETTINGS_LOAD: 'settings:load',
SETTINGS_SAVE: 'settings:save',
ADD_FOLDER: 'folder:add',
REMOVE_FOLDER: 'folder:remove',
LIST_RECENT_FILES: 'folder:listRecent',
START_WATCHING_FOLDERS: 'folder:startWatching',
FILE_ADDED: 'file:added',
FILE_REMOVED: 'file:removed',
```

## Technical Approach

### Phase 1: Settings Persistence and Multi-Folder

**Goal:** Folders persist across sessions. Multiple folders in the sidebar. Live refresh via chokidar.

#### Settings (`src/main/settings.ts`)

```typescript
const SETTINGS_PATH = join(app.getPath('userData'), 'markup-settings.json')

const defaults: Settings = { folders: [], sidebarMode: 'tree' }

export async function loadSettings(): Promise<Settings> { ... }
export async function saveSettings(settings: Settings): Promise<void> { ... }
```

#### Multi-folder FileTree

Each watched folder is a root node. Remove button (X) appears on hover, with a confirmation dialog before removing.

```
▾ ~/dev/markup/docs                               ×
    plans/
      2026-03-28-001-feat-...
    BUGS.md
▾ ~/dev/other-project/docs                        ×
    spec.md
```

#### "Add Folder" (renamed from "Open Folder")

The sidebar button and welcome screen button should say "Add Folder" — this adds a folder to the persistent workspace, not a one-time browse.

#### Standalone file open (Cmd+O) behavior change

Cmd+O / drag-and-drop a single file should:
- Open the file in a pinned tab
- NOT change the sidebar folders
- NOT call `listDirectory`

Only "Add Folder" should affect the sidebar.

#### Live refresh with chokidar

Install `chokidar` and use it to watch all configured folders. When `.md` files are created, changed, or removed, the sidebar refreshes automatically. This solves the current problem where new files don't appear until the app is restarted.

**Files to change:**
- [ ] `src/main/settings.ts` — NEW: load/save settings JSON
- [ ] `src/main/folder-watcher.ts` — NEW: chokidar watchers for all folders, emits events + refreshes file lists
- [ ] `src/main/index.ts` — IPC handlers for settings, add/remove folder, wire watcher events
- [ ] `src/preload/index.ts` — expose settings and folder management APIs
- [ ] `src/shared/ipc-channels.ts` — new channel constants
- [ ] `src/shared/types.ts` — `WorkspaceSettings`, `WatchedFile` types
- [ ] `src/renderer/src/App.tsx` — load settings on startup, manage folder list, decouple file open from sidebar
- [ ] `src/renderer/src/components/Sidebar/FileTree.tsx` — render multiple root folders with hover X + confirmation
- [ ] `src/renderer/src/components/Sidebar/SidebarHeader.tsx` — NEW: mode toggle + add folder

**Acceptance criteria:**
- [ ] Added folders persist across app restart
- [ ] Multiple folders show as separate roots in the tree
- [ ] X button on hover for each root folder, with confirmation dialog
- [ ] "Add Folder" button adds a folder (via directory dialog)
- [ ] Cmd+O opens a file without changing the sidebar
- [ ] New .md files appear in the sidebar automatically (live refresh)
- [ ] Settings stored in `app.getPath('userData')/markup-settings.json`

### Phase 2: Recently Updated Mode

**Goal:** A recency-sorted list of all .md files across watched folders, grouped by folder.

#### `src/main/folder-watcher.ts` (extended)

```typescript
interface WatchedFile {
  path: string
  name: string
  folder: string       // root folder path this belongs to
  folderName: string   // last segment of folder path for display
  relativePath: string // path relative to root folder
  mtime: number
  isNew: boolean
}
```

`listRecentFiles()`: collect all `.md` files across watched folders, `stat` each, sort by `mtime` descending, group by folder.

#### `src/renderer/src/components/Sidebar/RecentFiles.tsx`

A recency-sorted list grouped by folder:

```
markup/docs
  ● 2026-03-29-001-feat-...         2m ago
    BUGS.md                          15m ago

other-project/docs
    spec.md                          1h ago
```

- Green dot badge for files changed since last viewed
- Relative timestamps ("2m ago", "1h ago", "yesterday")
- Click to open (preview tab), double-click to pin
- Folder name as group header (last 2 path segments for context)
- Auto-refreshes when chokidar emits events

#### Sidebar mode toggle

A segmented control in the sidebar header: `[Tree] [Recent]`

Persisted in settings.

**Files to change:**
- [ ] `src/main/folder-watcher.ts` — extend with `listRecentFiles()` grouped by folder
- [ ] `src/main/index.ts` — IPC handler for recent files
- [ ] `src/preload/index.ts` — expose recent files API
- [ ] `src/shared/ipc-channels.ts` — `LIST_RECENT_FILES` channel
- [ ] `src/shared/types.ts` — `WatchedFile` type
- [ ] `src/renderer/src/components/Sidebar/RecentFiles.tsx` — NEW: recency-sorted grouped list
- [ ] `src/renderer/src/components/Sidebar/SidebarHeader.tsx` — mode toggle (Tree/Recent)
- [ ] `src/renderer/src/App.tsx` — sidebar mode state, wire recent files events
- [ ] `src/renderer/src/styles.css` — styles for recent files, badges, mode toggle, folder groups

**Acceptance criteria:**
- [ ] "Recent" mode shows all .md files sorted by mtime, grouped by folder
- [ ] New/changed files get a green dot badge
- [ ] Badge clears when file is opened
- [ ] Relative timestamps update periodically
- [ ] Click opens as preview tab, double-click pins
- [ ] Folder group headers provide path context
- [ ] Sidebar mode persisted across restart
- [ ] chokidar watches efficiently (no CPU spike on large directories)

## Dependencies & Risks

| Dependency | Risk | Mitigation |
|-----------|------|------------|
| `chokidar` | Adds ~2MB to bundle, potential CPU usage on large dirs | Use `ignoreInitial: true`, respect gitignore, limit depth |
| Settings file I/O | Race conditions if multiple windows | Single-window app for v1 |
| Many watched folders | Performance: stat'ing thousands of files | Limit to .md files, cache mtimes, debounce scans |

## System-Wide Impact

### Interaction Graph
- App launch → main loads settings → starts chokidar watchers on saved folders → renderer receives initial file list
- User adds folder → main saves to settings, starts new watcher → renderer refreshes sidebar
- chokidar detects change → main emits IPC event → renderer updates recent list / refreshes tree
- User opens standalone file → tab created, sidebar unchanged

### State Lifecycle
- Settings on disk are the source of truth for folders
- Watcher state (chokidar instances) lives in main process only
- Recent file list is derived (not persisted) — rebuilt from watchers on each query
- Badge "new" state is renderer-side (cleared on open)

## Sources & References

### Internal
- `src/main/index.ts:43-139` — existing gitignore parsing + `listMarkdownFiles`
- `src/main/index.ts:195-230` — existing file watch/unwatch with content hashing
- `src/renderer/src/components/Sidebar/FileTree.tsx` — current tree component
- `src/renderer/src/App.tsx:94-136` — current `openFileInTab` with directory side-effect

### External
- [chokidar](https://github.com/paulmillr/chokidar) — efficient recursive file watcher
- [Electron app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname) — userData directory for settings
