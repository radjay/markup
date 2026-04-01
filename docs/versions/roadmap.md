---
title: "Markup Roadmap"
date: 2026-03-30
---

# Markup Roadmap

## v0.2 — Stability & Polish

Focus: Fix the known issues from v0.1 and polish the day-to-day UX. No new features — just make what exists reliable.

### Bug Fixes
- [ ] **Unsaved-changes prompt on file/tab switch** — warn before discarding unsaved comments
- [ ] **Save failure UI** — show error toast/banner when write fails (e.g., read-only file)
- [ ] **`-->` in comment body** — escape or encode arrow sequences to prevent HTML comment breakage
- [ ] **Scroll position per tab** — preserve and restore scroll position when switching tabs
- [ ] **Deleted file handling** — graceful error when a file is removed between sidebar listing and click
- [ ] **Outline scroll in edit mode** — currently queries `.review-mode` DOM; needs CodeMirror line-scroll fallback
- [ ] **Duplicate heading IDs in outline** — disambiguate so clicking scrolls to the correct one
- [ ] **Anchor stability after heading edits** — fallback anchoring strategy when content hash changes

### UX Polish
- [ ] **External change + unsaved work** — warn user that reload will discard their unsaved comments
- [ ] **Typecheck CI** — run `npm run typecheck` in a pre-commit hook or CI
- [ ] **Update BUGS.md** — close the 2 feature requests already shipped (folder persistence, multi-folder)

### Documentation
- [ ] Resolve outstanding `@markup` comments in the original plan doc
- [ ] Update test plan to v0.2 with new test cases for fixed bugs

---

## v0.3 — Edit Provenance & Diff Layer

Focus: Make the review loop visible. Show what changed between review cycles.

### Features
- [ ] **Snapshot on open** — capture file content when first opened in a session
- [ ] **User edit highlighting** — faint green background on blocks the reviewer modified
- [ ] **Agent change highlighting** — faint blue background on blocks that changed after reload
- [ ] **Toggleable diff overlay** — button to show/hide the diff layer
- [ ] **Sidecar storage** — `.markup/` directory per watched folder for provenance data

### Why
Currently, when the agent rewrites a file in response to feedback, the reviewer can't see what changed without manually diffing. This makes multi-round reviews slow and error-prone. Visible provenance makes the feedback loop tangible.

See: [ideation doc](../ideation/2026-03-28-review-workflow-ideation.md) idea #2

---

## v0.4 — Comment Lifecycle & History

Focus: Comments are currently ephemeral — once the agent removes them, they're gone. Build a history layer.

### Features
- [ ] **Comment archive** — when comments disappear from the file (agent removed them), archive to `.markup/history.json`
- [ ] **Resolved comments panel** — collapsible "History" section in the right panel showing past feedback
- [ ] **Resolution status** — track whether comments were addressed, dismissed, or still pending
- [ ] **Comment search** — search across current and archived comments

### Why
Users leave fewer comments when feedback feels disposable. A persistent archive makes review feel safe and builds institutional knowledge over time. Foundation for the intelligence pipeline (v0.6).

See: [ideation doc](../ideation/2026-03-28-review-workflow-ideation.md) idea #3

---

## v0.5 — Section-Level Approval & Quick Reactions

Focus: Move from document-level status to per-section review signals.

### Features
- [ ] **Section stamps** — one-click per section: approved, needs-work, rejected
- [ ] **Serialized section status** — structured metadata the agent can parse programmatically
- [ ] **Quick reaction templates** — "expand this", "simplify", "needs evidence" for common feedback
- [ ] **Document status derived from sections** — auto-compute overall status from section statuses

### Why
For long plans, a blanket "changes requested" forces the agent to re-read everything. Section-level status gives precise signal. Quick reactions reduce friction for simple feedback.

See: [ideation doc](../ideation/2026-03-28-review-workflow-ideation.md) idea #5

---

## Backlog — UX Polish & Settings

Small improvements logged 2026-03-31. Not assigned to a version yet.

### UI Polish
- [ ] **Border below macOS window buttons** — visible divider above sidebars and tab bar
- [ ] **Unify toggle components** — Files/Recent and Review/Edit toggles should share the same component and sizing
- [ ] **Save button height** — match the Review/Edit toggle height

### Settings
- [ ] **Settings screen** — gear button in top-right, opens a settings view with basic app preferences
- [ ] **App icon picker** — setting to choose between black-background and vivid-background macOS app icons

### Sidebar & Tabs
- [ ] **Group recent files by date** — Today, Yesterday, This Week, etc. instead of individual relative timestamps
- [ ] **File path tooltip on hover** — show full path when hovering files in sidebar, recent tab, or open tabs

---

## Future — Exploratory

These are high-value ideas that need more design work before committing to a version.

### Bidirectional Agent Conversation
Extend `@markup` format to support `@markup-reply` from agents. Render as threaded conversations. Requires agent-side adoption of the reply format.

- **Confidence:** 65%
- **Complexity:** High
- See: [ideation doc](../ideation/2026-03-28-review-workflow-ideation.md) idea #6

### Feedback Intelligence Pipeline
Analyze recurring themes in archived comments. Surface patterns ("You've left 8 comments about missing error handling across 3 docs"). One-click export to CLAUDE.md instructions.

- **Confidence:** 60%
- **Complexity:** High (but incremental)
- **Prerequisite:** Comment history archive (v0.4)
- See: [ideation doc](../ideation/2026-03-28-review-workflow-ideation.md) idea #7

### Desktop Notifications
Notify when agents write new markdown files in watched folders. Draft plan exists at `docs/plans/2026-03-29-002-feat-desktop-notifications-draft-plan.md`.

### Cross-Platform
- Windows and Linux builds via electron-builder
- Currently macOS-only

---

## Shipped

### v0.1 — Foundation (2026-03-28 to 2026-03-30)
Core review workflow, multi-folder workspace, tabbed editor, edit mode, file watching, comment serialization, Claude Code plugin, macOS DMG packaging. See [current.md](current.md) for full details.
