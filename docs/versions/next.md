---
title: "Markup v0.2 Plan"
version: "0.2.0"
date: "2026-03-31"
status: "active"
origin: "docs/versions/current.md"
markup_reviewed: true
markup_reviewed_at: "2026-03-31T10:59:34.225Z"
markup_status: "commented"
---
# Markup v0.2 Plan

v0.2 stabilizes the v0.1 foundation and addresses all feedback from the first round of real usage. Grouped into: critical bugs, UX improvements, small new features, and documentation.

---

## Critical Bug Fixes

- [ ] **File watching triggers on self-save** — saving in Markup immediately shows "modified externally" bar. Suppress change events for our own writes (e.g., track last-save timestamp per path, ignore chokidar events within a short window)
- [ ] **`-->` in comment body breaks serialization** — escape `-->` as `--&gt;` on serialize, unescape on parse (`src/renderer/src/lib/markdown/comments.ts`)
- [ ] **No unsaved-changes prompt on file/tab switch** — show confirmation dialog before switching away from a dirty tab
- [ ] **Silent save failures** — catch write errors and show an inline error banner
- [x] **Comment badge always shows "1" and pushes content down** — badge count wasn't reflecting actual comment count per anchor; also moved badge to left side of block instead of below content
- [ ] **Deleted file handling** — graceful error when file is removed between sidebar listing and click

## UX Improvements

- [ ] **Solid Save button** — render Save as a filled primary-color button when there are unsaved changes (currently it's an outline button that doesn't stand out)
- [ ] **Edit comments** — add edit capability to both inline and document-level comments (currently can only add and delete). Pencil icon, inline textarea, Cmd+Enter to confirm
- [ ] **Scroll position per tab** — store `scrollTop` in tab state on switch-away, restore on switch-back
- [ ] **External change + unsaved work** — warn that reload will discard unsaved changes before proceeding
- [ ] **Git branch on folder headers** — show the current branch next to each top-level folder name in the Files sidebar (git info already available via `folder-watcher.ts`)
- [ ] **Remove dot prefix from Document Outline title** — the "DOCUMENT OUTLINE" panel header has a leading bullet that looks odd
- [ ] **Outline scroll in edit mode** — currently queries `.review-mode` DOM which doesn't exist in edit mode; needs CodeMirror line-based fallback
- [ ] **Duplicate heading IDs in outline** — disambiguate so clicking scrolls to the correct heading instance
- [ ] **Anchor stability after heading edits** — fallback anchoring when heading content hash changes

## New Features

- [ ] **CLI to open files** — register a `markup` command or URL scheme so files can be opened from the terminal (e.g., `markup open docs/plan.md`). Handle via Electron `open-file` event or `second-instance` with argv
- [ ] **UI kit / color scheme docs** — create `docs/ui-kit.md` documenting CSS custom properties, typography scale, component patterns, and the Lucide Icons convention

## Documentation & Housekeeping

- [ ] **Update BUGS.md** — close the 2 feature requests already shipped (folder persistence, multi-folder)
- [ ] **Resolve @markup comments** in the original plan doc (`docs/plans/2026-03-28-001-...`)
- [ ] **Update test plan** to v0.2 with new test cases for fixed bugs
- [ ] **Typecheck CI** — add `npm run typecheck` to a pre-commit hook or CI step

---

## Sources

- **v0.1 review feedback:** [docs/versions/current.md](current.md) — 8 document-level @markup comments
- **Known bugs:** [docs/versions/current.md](current.md) "Known Issues" section (9 items)
- **Original roadmap:** [docs/versions/roadmap.md](roadmap.md) v0.2 section
- **Ideation:** [docs/ideation/2026-03-28-review-workflow-ideation.md](../ideation/2026-03-28-review-workflow-ideation.md)