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

- [x] **File watching triggers on self-save** — self-saves suppressed via timestamp tracking (2s window)
- [x] **`-->` in comment body breaks serialization** — escaped as `--&gt;` on serialize, unescaped on parse
- [x] **No unsaved-changes prompt on file/tab switch** — confirmation dialog when switching away from dirty tab
- [x] **Silent save failures** — inline error banner with dismiss on write errors
- [x] **Comment badge always shows "1" and pushes content down** — badge count wasn't reflecting actual comment count per anchor; also moved badge to left side of block instead of below content
- [x] **Deleted file handling** — try/catch with user alert on error

## UX Improvements

- [x] **Solid Save button** — Save button now solid primary color when unsaved changes exist
- [x] **Edit comments** — inline and document-level comments editable via pencil icon, Cmd+Enter to confirm
- [x] **Scroll position per tab** — scrollTop stored in tab state on switch-away, restored on switch-back
- [x] **External change + unsaved work** — reload warns about discarding unsaved changes
- [x] **Git branch on folder headers** — branch name shown next to top-level folders in Files sidebar
- [x] **Remove dot prefix from Document Outline title** — leading bullet removed from panel title
- [x] **Outline scroll in edit mode** — CodeMirror line-based scroll fallback added
- [x] **Duplicate heading IDs in outline** — disambiguated with counters for unique IDs
- [x] **Anchor stability after heading edits** — fallback positional anchoring when heading text changes

## New Features

- [ ] **CLI to open files** — register a `markup` command or URL scheme so files can be opened from the terminal (e.g., `markup open docs/plan.md`). Handle via Electron `open-file` event or `second-instance` with argv. Tracked as RAD-14.
- [x] **UI kit / color scheme docs** — created `docs/ui-kit.md` with full design system documentation

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