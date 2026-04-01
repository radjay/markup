---
title: "UX Polish & Settings Screen"
type: feat
status: active
date: 2026-03-31
---

# UX Polish & Settings Screen

Seven UX improvements to tighten visual consistency and add basic user preferences. Grouped into three phases: quick CSS/JSX wins, component refactoring, and the settings feature.

---

## Phase 1: CSS & JSX Quick Wins (no architectural changes)

### 1.1 Border below macOS window buttons

Add a 1px divider below the titlebar drag region to visually separate it from the sidebar and tab bar.

**Files:**
- `src/renderer/src/styles.css:194-199` — add `border-bottom: 1px solid var(--border)` to `.titlebar-drag`

**Acceptance Criteria:**
- [ ] Visible 1px border appears below the 38px title bar region
- [ ] Uses `var(--border)` to match existing sidebar header dividers
- [ ] Welcome screen drag region (`.welcome::before`) also gets the border for consistency

---

### 1.2 File path tooltip on hover

Add native `title` attribute tooltips showing the full absolute path when hovering files in the sidebar, recent list, and open tabs.

**Files:**
- `src/renderer/src/components/Layout/TabBar.tsx:21` — add `title={tab.filePath}` to the tab div
- `src/renderer/src/components/Sidebar/FileTree.tsx:63` — add `title={entry.path}` to `.file-node-row` divs
- `src/renderer/src/components/Sidebar/RecentFiles.tsx:46` — add `title={file.path}` to `.recent-file-row` divs

**Acceptance Criteria:**
- [ ] Hovering a tab shows the full file path as a native browser tooltip
- [ ] Hovering a file in the Files tree shows the full path
- [ ] Hovering a file in the Recent list shows the full path

---

### 1.3 Save button height alignment

Reduce the save button's vertical padding from 5px to 4px so it matches the mode toggle height.

**Files:**
- `src/renderer/src/styles.css:203-233` — change `.titlebar-button` padding from `5px 14px` to `4px 14px`

**Acceptance Criteria:**
- [ ] Save button and Review/Edit toggle are visually the same height
- [ ] No layout shift in the tab bar right section

---

## Phase 2: Component Refactoring

### 2.1 Shared SegmentedToggle component

Extract a reusable `SegmentedToggle` component from the two existing toggle implementations. Use a `size` prop to preserve both current sizes while sharing the structural code.

**New file:** `src/renderer/src/components/shared/SegmentedToggle.tsx`

```tsx
interface SegmentedToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'default'  // sm = sidebar (11px/3px 10px), default = tab bar (12px/4px 12px)
}
```

**Refactor targets:**
- `src/renderer/src/components/Sidebar/SidebarHeader.tsx` — replace inline `.sidebar-mode-toggle` markup with `<SegmentedToggle size="sm" />`
- `src/renderer/src/components/Layout/TabBar.tsx:39-52` — replace inline `.mode-toggle` markup with `<SegmentedToggle />`

**CSS:** Consolidate `.sidebar-mode-toggle` and `.mode-toggle` CSS blocks into a single `.segmented-toggle` class with a `.segmented-toggle--sm` modifier.

**Acceptance Criteria:**
- [ ] Both toggles render identically to their current appearance (no visual regression)
- [ ] Sidebar toggle uses `size="sm"`, tab bar toggle uses default size
- [ ] A single CSS block (with size modifier) replaces the two separate blocks
- [ ] Old `.sidebar-mode-toggle` and `.mode-toggle` CSS classes are removed

---

### 2.2 Group recent files by date

Replace the flat recent files list with date-bucketed groups. Remove individual relative timestamps ("2h ago").

**Bucket logic (calendar-based, local timezone):**
- **Today** — same calendar day
- **Yesterday** — previous calendar day
- **This Week** — same ISO week (Monday–Sunday), excluding today/yesterday
- **This Month** — same calendar month, excluding this week
- **Older** — everything else

**Files:**
- `src/renderer/src/components/Sidebar/RecentFiles.tsx` — replace `relativeTime()` and flat list rendering with bucket grouping. Use existing `.recent-group` / `.recent-group-header` CSS classes (styles.css:1123-1134).

**Implementation notes:**
- Write a pure `bucketByDate(files: WatchedFile[])` function that returns `{ label: string, files: WatchedFile[] }[]`
- Omit empty buckets entirely (don't render headers with no files)
- The 30-second re-render interval (existing) handles midnight bucket transitions
- Files within each bucket are sorted by mtime descending (most recent first)

**Acceptance Criteria:**
- [ ] Recent files are grouped under date headers (Today, Yesterday, This Week, This Month, Older)
- [ ] No individual relative timestamps appear next to files
- [ ] Empty buckets are not shown
- [ ] Files within each bucket are sorted most-recent-first
- [ ] Bucket transitions happen naturally on the existing 30s re-render tick

---

## Phase 3: Settings Screen

### 3.1 Settings infrastructure

**Navigation model:** Modal overlay with backdrop. This preserves all editor/tab state, requires no routing, and matches the app's single-page architecture. Pressing `Escape` or clicking the backdrop closes it.

**Settings button placement:** In the titlebar drag region, right-aligned. Requires `-webkit-app-region: no-drag` on the button. This keeps it consistently visible regardless of which tab or view is active, and separates app-level settings from document-level controls (mode toggle, save).

**Entry points (all equivalent):**
1. Gear icon button in top-right of titlebar
2. `Cmd+,` keyboard shortcut
3. App menu → "Settings..." (placed after "About Markup" in the app-name menu, following macOS Ventura convention)

**Files to modify:**
- `src/main/index.ts:250-263` — add "Settings..." menu item with `accelerator: 'CmdOrCtrl+,'`, send IPC event `menu:openSettings`
- `src/shared/ipc-channels.ts` — add `MENU_OPEN_SETTINGS` channel
- `src/preload/index.ts` — expose `onOpenSettings` listener
- `src/renderer/src/App.tsx` — add settings modal state, render `<SettingsModal />` when open, listen for IPC/keyboard trigger
- `src/renderer/src/styles.css` — add gear button in titlebar styles, settings modal/overlay styles

**New file:** `src/renderer/src/components/Settings/SettingsModal.tsx`

**Behavior:**
- `Cmd+,` toggles the modal (open if closed, close if open)
- Clicking backdrop or pressing `Escape` closes the modal
- Settings save immediately on change (no explicit save button) — mirrors macOS System Settings behavior
- Settings persist via existing `saveSettings()` IPC

**Acceptance Criteria:**
- [ ] Gear icon visible in top-right of titlebar on all screens (including welcome)
- [ ] Clicking gear, pressing Cmd+,, or using app menu all open the settings modal
- [ ] Modal overlays the editor without disrupting tab/editor state
- [ ] Escape and backdrop click close the modal
- [ ] Settings changes persist immediately

---

### 3.2 Settings schema expansion

Expand the `Settings` interface to support new preferences.

**File:** `src/main/settings.ts` and `src/shared/types.ts`

```typescript
interface Settings {
  // Existing
  folders: string[]
  sidebarMode: 'tree' | 'recent'
  autosave: boolean

  // New
  appIcon: 'light' | 'dark'           // Icon variant (assets/app-icon.png vs app-icon-dark.png)
  defaultMode: 'review' | 'edit'      // Mode when opening a new file
  fontSize: number                     // Base font size for rendered markdown (default: 15)
  authorName: string                   // Author name for @markup comments (default: '')
}
```

**Defaults for new fields:** `appIcon: 'light'`, `defaultMode: 'review'`, `fontSize: 15`, `authorName: ''`

**Migration:** `loadSettings()` already handles missing fields gracefully (spreads over defaults). No explicit migration needed.

---

### 3.3 App icon picker

Add a setting to switch between the two macOS app icons.

**Files:**
- `src/main/index.ts:13` — read `appIcon` from settings before creating window, use corresponding path
- `src/main/index.ts:391` — load settings before `createWindow()` to avoid icon flash on startup
- `src/main/index.ts` — add IPC handler for `settings:setAppIcon` that calls `app.dock.setIcon()` with the selected icon path

**Startup order change:**
```
// Before (current):
app.whenReady() → createWindow() → loadSettings()

// After:
app.whenReady() → loadSettings() → createWindow(settings)
```

Settings is a synchronous local JSON file read, so this adds negligible startup latency.

**UI in SettingsModal:** A `SegmentedToggle` with "Light" / "Dark" labels. Optionally show small icon thumbnails next to the labels if the icons are bundled as renderer assets.

**Acceptance Criteria:**
- [ ] Toggling the icon setting immediately updates the dock icon
- [ ] On next launch, the app starts with the selected icon (no flash)
- [ ] Default is "Light" (preserves current behavior)

---

### 3.4 Proposed settings for the settings screen

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| **App Icon** | toggle: Light / Dark | Light | Switches dock + window icon |
| **Default Mode** | toggle: Review / Edit | Review | Mode used when opening a new file |
| **Font Size** | number input or slider | 15 | Base font size for markdown rendering |
| **Author Name** | text input | (empty) | Used as `author` field in @markup comments |

These four settings cover real user needs today without over-engineering. Additional settings (theme, show hidden files, auto-save interval) can be added later as rows in the same modal.

---

## Implementation Order

1. **Phase 1** (1.1, 1.2, 1.3) — CSS/JSX one-liners, no dependencies, can ship as a single commit
2. **Phase 2.1** (SegmentedToggle) — component extraction, then used by Phase 3 UI
3. **Phase 2.2** (date grouping) — independent of settings work
4. **Phase 3.1** (settings infrastructure) — modal, entry points, IPC
5. **Phase 3.2** (settings schema) — expand interface
6. **Phase 3.3** (icon picker) — requires 3.1 + 3.2
7. **Phase 3.4** (remaining settings) — uses the same modal, additive

Phases 2.1 and 2.2 are independent and can be done in parallel.

---

## Sources

- **Repo research:** Existing toggle CSS at `styles.css:841-867` and `styles.css:955-981`; settings backend at `src/main/settings.ts`; unused date-group CSS at `styles.css:1123-1134`; icon assets at `assets/app-icon.png` and `assets/app-icon-dark.png`
- **Tracked in:** `docs/BUGS.md` (Open section) and `docs/versions/roadmap.md` (Backlog section)
