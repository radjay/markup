---
title: "v0.2 — Stability, Polish & Feedback"
type: feat
status: active
date: "2026-03-31"
origin: docs/versions/current.md
---

# v0.2 — Stability, Polish & Feedback

## Overview

Address all feedback from the v0.1 review cycle and fix every known bug. Introduces three small features (comment history, CLI, UI kit docs) that came directly from first-use feedback. No architectural changes — all work builds on the existing codebase.

## Problem Statement

v0.1 shipped a functional review workflow but real usage surfaced 9 bugs (some causing silent data loss), 6 UX friction points, and 3 missing capabilities. The most critical: self-saves trigger false "modified externally" alerts, switching tabs silently discards unsaved comments, and there's no way to edit a comment after posting it.

## Proposed Solution

Ship a single v0.2 release that fixes all known issues and adds the three most-requested features. Work is ordered by impact: critical bugs first, then UX improvements, then new features.

The full checklist lives in [docs/versions/next.md](../versions/next.md).

## Implementation Approach

### Phase 1: Critical Bugs (do first — these cause data loss or broken UX)

| Item | Files | Approach |
|------|-------|----------|
| Self-save triggers external change bar | `folder-watcher.ts`, `useActiveDocument.ts` | Track `lastSaveTimestamp` per file path; ignore chokidar events within 2s of save |
| `-->` in comment body | `comments.ts` | Escape `-->` → `--&gt;` on serialize, reverse on parse |
| No unsaved-changes prompt | `useTabs.ts`, `useAppEvents.ts` | Check `hasUnsavedChanges` before `openFileInTab`; show confirm dialog |
| Silent save failures | `useActiveDocument.ts` | Wrap save in try/catch, set error state, render `SaveErrorBar` component |
| Deleted file handling | `useAppEvents.ts` | Wrap `readFile` in try/catch, show "File not found" message |

### Phase 2: UX Improvements

| Item | Files | Approach |
|------|-------|----------|
| Solid Save button | `styles.css` | Add `.save-button.dirty` with `background: var(--accent)` |
| Edit comments | `InlineComment.tsx`, `DocumentComments.tsx` | Add edit state per comment, toggle textarea, Cmd+Enter to save |
| Scroll position per tab | `useTabs.ts`, `EditorPane.tsx` | Add `scrollTop: number` to Tab type, save/restore on switch |
| External change + unsaved warning | `ExternalChangeBar.tsx` | Check `hasUnsavedChanges` before reload, show confirm |
| Git branch on folder headers | `FileTree.tsx` | Pass branch info from workspace hook, render in FolderRoot |
| Remove outline title dot | `RightPanel.tsx` or `Outline.tsx` | Remove `"• "` prefix string |
| Outline scroll in edit mode | `useActiveDocument.ts` | Use CodeMirror `scrollTo` for line-based scrolling when in edit mode |
| Duplicate heading disambiguation | `useActiveDocument.ts` | Append index suffix to duplicate heading IDs |
| Anchor stability | `comments.ts` | Fallback: match by heading level + position index when content hash fails |

### Phase 3: New Features

| Item | Files | Approach |
|------|-------|----------|
| CLI | `src/main/index.ts`, new `cli/` | Handle `open-file` event + `process.argv` for dev; ship shell wrapper for packaged app |
| UI kit docs | New `docs/ui-kit.md` | Extract `:root` variables, typography, component patterns from `styles.css` |

### Phase 4: Documentation & Housekeeping

- Update BUGS.md (close shipped items)
- Resolve @markup comments in original plan doc
- Update test plan to v0.2
- Add typecheck to pre-commit or CI

## Acceptance Criteria

- [ ] Saving a file does NOT trigger "modified externally" bar
- [ ] `-->` in comment text round-trips correctly
- [ ] Switching away from a dirty tab prompts for confirmation
- [ ] Save errors show a visible error message
- [ ] Deleted files in sidebar show graceful error
- [ ] Save button is solid primary when dirty
- [ ] Comments can be edited inline
- [ ] Scroll position preserved across tab switches
- [ ] External change reload warns about unsaved work
- [ ] Git branch shows next to folder names in Files sidebar
- [ ] Outline title has no bullet prefix
- [ ] Outline scroll works in edit mode
- [ ] Duplicate headings scroll to the correct one
- [ ] Comment anchors survive heading edits
- [ ] CLI opens files in the running Markup instance
- [ ] `docs/ui-kit.md` documents the design system
- [ ] BUGS.md is up to date
- [ ] Test plan updated for v0.2

## Sources

- **Origin:** [docs/versions/current.md](../versions/current.md) — 8 document-level @markup comments from v0.1 review + 9 known bugs
- **Full checklist:** [docs/versions/next.md](../versions/next.md)
- **Roadmap:** [docs/versions/roadmap.md](../versions/roadmap.md)
