---
title: "refactor: Break App.tsx into atomic components with hooks"
type: refactor
status: active
date: 2026-03-30
---

# Break App.tsx into Atomic Components with Hooks

## Overview

App.tsx is 514 lines with ~30 callbacks, 6 useEffects, and all state management inlined. It handles tabs, workspace settings, file operations, sidebar mode, drag-and-drop, keyboard shortcuts, menu events, and rendering — all in one component. This refactor extracts state logic into custom hooks and UI into focused components.

## Problem Statement

App.tsx currently owns:
- Tab state (open/close/switch/pin/preview, ~80 lines)
- Workspace state (folders, settings load/save, sidebar mode, ~60 lines)
- File operations (open, save, reload, ~40 lines)
- Comment handlers (add/delete inline + doc, ~40 lines)
- Effects (settings init, chokidar events, menu events, drag-drop, keyboard shortcuts, ~80 lines)
- All JSX (welcome screen, sidebar, tab bar, editor area, comments panel, ~100 lines)

Adding any new feature means touching this 500-line file. State dependencies are hard to trace. The welcome screen, tab bar, and editor area are inlined as JSX rather than being composable components.

## Proposed Solution

### Custom Hooks (extract state + logic)

| Hook | Responsibility | Lines from App.tsx |
|------|---------------|-------------------|
| `useWorkspace` | folders, settings persistence, sidebar mode, recent files, chokidar events | 50-135, 177-198, 338-345 |
| `useTabs` | tab state, open/close/pin/switch, preview replacement, active tab | 49-68, 137-244 |
| `useActiveDocument` | comment CRUD, save, reload, mode toggle, edit changes for the active tab | 246-336 |
| `useAppEvents` | menu events, drag-drop, keyboard shortcuts | 347-397 |

### UI Components (extract JSX)

| Component | What it renders | Currently inlined in |
|-----------|----------------|---------------------|
| `WelcomeScreen` | Logo, open file/add folder buttons, drag hint | App.tsx:401-418 |
| `TabBar` | Tab list + mode toggle + save button | App.tsx:456-483 |
| `ExternalChangeBar` | "Modified externally" notification | App.tsx:486-492 |
| `EditorPane` | Routes to ReviewMode / EditMode / empty state | App.tsx:494-502 |
| `RightPanel` | DocumentComments + Outline | App.tsx:505-510 |
| `MarkupLogo` | SVG logo (used in welcome screen) | App.tsx:405-408 |

### Target Structure

```
src/renderer/src/
  App.tsx                    # ~60 lines: compose hooks + layout components
  hooks/
    useWorkspace.ts          # folder management, settings, recent files
    useTabs.ts               # tab state machine
    useActiveDocument.ts     # comment CRUD, save, reload, mode toggle
    useAppEvents.ts          # menu, drag-drop, keyboard shortcuts
  components/
    Layout/
      WelcomeScreen.tsx      # welcome page
      TabBar.tsx             # tab bar with mode toggle
      ExternalChangeBar.tsx  # file changed notification
      EditorPane.tsx         # review/edit mode router
      RightPanel.tsx         # comments + outline
    Sidebar/                 # (existing, unchanged)
    Editor/                  # (existing, unchanged)
    Comments/                # (existing, unchanged)
    ui/
      MarkupLogo.tsx         # SVG logo component
```

### Target App.tsx (~60 lines)

```tsx
export default function App() {
  const workspace = useWorkspace()
  const tabManager = useTabs()
  const doc = useActiveDocument(tabManager)
  useAppEvents({ workspace, tabManager, doc })

  if (!workspace.loaded) return null

  if (tabManager.tabs.length === 0 && workspace.folders.length === 0) {
    return <WelcomeScreen onOpenFile={...} onAddFolder={...} />
  }

  return (
    <div className="app">
      <div className="titlebar-drag" />
      <div className="main-content">
        <Sidebar workspace={workspace} tabManager={tabManager} />
        <div className="editor-area">
          <TabBar tabs={tabManager} doc={doc} />
          <ExternalChangeBar ... />
          <EditorPane doc={doc} />
        </div>
        <RightPanel doc={doc} />
      </div>
    </div>
  )
}
```

## Implementation Phases

### Phase 1: Extract Hooks

Move state and callbacks out of App.tsx into focused hooks. No UI changes — the rendered output is identical.

**Files to create:**
- [ ] `src/renderer/src/hooks/useWorkspace.ts` — folders, settings, sidebarMode, recentFiles, viewedFiles, folderFiles, chokidar event handling, addFolder, removeFolder, sidebarModeChange
- [ ] `src/renderer/src/hooks/useTabs.ts` — tabs[], activeTabIndex, openFileInTab, closeTab, tabClick, pinFile, updateTab, updateActiveTab, activeTab derived value
- [ ] `src/renderer/src/hooks/useActiveDocument.ts` — headings memo, save, modeToggle, editChange, add/delete inline/doc comments, reloadFile, scrollToHeading, showExternalChangeBar
- [ ] `src/renderer/src/hooks/useAppEvents.ts` — menu event listeners, drag-drop handler, keyboard shortcuts (Cmd+W)

**Files to modify:**
- [ ] `src/renderer/src/App.tsx` — replace inlined state with hook calls

**Acceptance criteria:**
- [ ] App.tsx is under 100 lines
- [ ] Each hook is under 120 lines
- [ ] All existing functionality works identically
- [ ] No new dependencies

### Phase 2: Extract Layout Components

Move inlined JSX into dedicated components.

**Files to create:**
- [ ] `src/renderer/src/components/Layout/WelcomeScreen.tsx`
- [ ] `src/renderer/src/components/Layout/TabBar.tsx`
- [ ] `src/renderer/src/components/Layout/ExternalChangeBar.tsx`
- [ ] `src/renderer/src/components/Layout/EditorPane.tsx`
- [ ] `src/renderer/src/components/Layout/RightPanel.tsx`
- [ ] `src/renderer/src/components/ui/MarkupLogo.tsx`

**Files to modify:**
- [ ] `src/renderer/src/App.tsx` — import and use new components

**Acceptance criteria:**
- [ ] App.tsx is under 60 lines
- [ ] Each layout component is focused on one concern
- [ ] No CSS changes needed (existing class names preserved)
- [ ] All existing functionality works identically

### Phase 3: Type cleanup

- [ ] Move `Tab` interface and `parseFileIntoTab` to `src/shared/types.ts` or a dedicated `src/renderer/src/lib/tabs.ts`
- [ ] Export hook return types for component props
- [ ] Remove unused imports

**Acceptance criteria:**
- [ ] Types are importable from a single location
- [ ] No `any` types
- [ ] Clean imports throughout

## Scope Boundaries

- **No new features** — this is a pure refactor
- **No CSS changes** — existing styles and class names are preserved
- **No visual changes** — the rendered output must be pixel-identical
- **No new dependencies** — just reorganizing existing code

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Stale closure bugs when splitting callbacks across hooks | Each hook receives the state it needs as params or via refs |
| React re-render performance | Hooks use the same `useCallback`/`useMemo` patterns as current code |
| Breaking existing behavior | No new features; test every flow manually after refactor |

## Sources

### Internal
- `src/renderer/src/App.tsx` — the 514-line file being refactored
- `src/renderer/src/components/` — existing component patterns to follow
