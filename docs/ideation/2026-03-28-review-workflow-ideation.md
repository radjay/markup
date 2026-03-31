# Ideation: Review Workflow Improvements

## Codebase Context

Markup is an early-stage Electron + React + TypeScript native markdown editor (~13 source files) for reviewing AI-generated plans and documents. Built with electron-vite, clean three-process split (main/preload/renderer) with shared types layer.

**Current state:**
- No file panel or browser — files opened via Mac dialog only
- No edit tracking or diff highlighting
- No comment history persistence — comments embedded inline, lost when agent removes them
- Comments anchor only to headings (h1/h2/h3) — `selection` field exists in types but is unused
- Document-level `markup_status` only (approved/changes_requested/commented), no section-level status
- No file watching or auto-reload
- Single-file workflow — no multi-file awareness

**No past learnings** — greenfield project with only an initial commit.

## Ranked Ideas

### 1. Recency-Sorted File Watch Panel

**Description:** Replace the OS file dialog with a persistent side panel that watches user-configured folders and surfaces markdown files sorted by last-modified time. New/changed files bubble to top with a badge. One click to open. Auto-reload when the open file changes externally. Desktop notifications when agents write new files.

**Rationale:** This is the foundation — it transforms Markup from a single-file editor into a workspace. Every multi-file feature builds on this. The current workflow requires Cmd+O and navigating through Finder every time an agent produces a document. For a tool meant to sit open while agents work, file-finding should be zero-effort.

**Downsides:** Requires chokidar or similar for reliable cross-platform file watching. Folder configuration needs persistent settings storage (doesn't exist yet). Could surface noise if watched folders contain many non-relevant markdown files.

**Confidence:** 90%
**Complexity:** Medium
**Status:** Unexplored

### 2. Edit Provenance & Diff Layer

**Description:** Snapshot file content when opened. Track user edits with faint green highlighting. On reload after agent rewrites, show agent changes in faint blue. Toggleable diff overlay. Store provenance in a sidecar `.markup/` directory so it survives sessions.

**Rationale:** Currently, when the user edits agent-generated markdown and saves, the agent cannot distinguish "text I wrote" from "text the human rewrote." This collapses a critical feedback signal. Visible diff highlighting also helps the reviewer remember what they touched. Goes beyond just user edits — shows what the agent changed in response too.

**Downsides:** Requires a lightweight diff algorithm (e.g., diff-match-patch). Sidecar files add filesystem clutter. Provenance tracking across external writes needs careful design around race conditions.

**Confidence:** 80%
**Complexity:** Medium-High
**Status:** Unexplored

### 3. Comment Lifecycle Engine with History Archive

**Description:** When the agent removes processed comments, Markup archives them (with original context, timestamp, resolution status) into a `.markup/history.json` sidecar. A collapsible "Resolved" panel in the UI lets users browse past feedback. The working document stays clean.

**Rationale:** Makes review feel safe — users leave more comments knowing nothing is lost. After 10+ review cycles, the user builds a searchable history of every piece of feedback and how it was handled. This is the foundation for compounding features (pattern detection, instruction export). Currently, once an agent cleans up addressed comments, that feedback context is lost forever.

**Downsides:** Sidecar file management adds complexity. Need to detect which comments the agent removed vs. which the user deleted. History could grow large on long-lived documents.

**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 4. Granular Comment Anchoring (Beyond Headings)

**Description:** Extend commenting to any block element — paragraphs, list items, code blocks. Subtle "+" icon in the margin on hover. Anchoring via content hash + nearest heading so comments survive minor edits. The `selection` field in `InlineComment` already exists in types but is unused — activate it.

**Rationale:** Heading-only comments force imprecise feedback. In a 20-line section, the agent has to guess which bullet you mean. Paragraph-level precision dramatically improves feedback quality, which is the entire value proposition of the tool.

**Downsides:** Anchor stability is hard — if the agent rewrites a paragraph, the content hash breaks. Needs a fallback anchoring strategy. UI density increases with more commentable elements.

**Confidence:** 75%
**Complexity:** Medium-High
**Status:** Unexplored

### 5. Section-Level Approval with Quick Reactions

**Description:** One-click stamps per section: approved, needs-work, rejected. Serialized as structured metadata the agent can parse programmatically. Also support lightweight comment templates ("expand this", "simplify", "needs evidence") for common feedback patterns.

**Rationale:** The current `markup_status` is document-level only. For long plans, a blanket "changes requested" forces the agent to re-read everything. Section-level status gives precise signal. Quick reactions reduce the cost of simple feedback from "type a sentence" to "one click."

**Downsides:** Adds UI complexity to each section header. Need to define how section status interacts with document-level status. Template taxonomy could feel restrictive if not customizable.

**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

### 6. Bidirectional Agent Conversation

**Description:** Extend the `@markup` format to support agent replies. Instead of deleting processed comments, the agent appends a `@markup-reply` with its response. Markup renders these as threaded conversations. The reviewer can resolve, reply again, or escalate.

**Rationale:** Real review is conversational. The agent's current response is invisible — it silently edits the plan. This makes agent reasoning visible and traceable, turning the file into an asynchronous dialogue. Transformative for multi-round reviews where the agent's fix might not address the concern.

**Downsides:** Requires agent-side adoption (the coding agent must learn the reply format). Threading UI adds complexity. Comment blocks grow larger. Risk of cluttering the document with conversation history.

**Confidence:** 65%
**Complexity:** High
**Status:** Unexplored

### 7. Feedback Intelligence Pipeline

**Description:** Builds on the comment archive (#3): analyze recurring themes in user feedback using lightweight keyword clustering. Surface a "Patterns" view ("You've left 8 comments about missing error handling across 3 docs"). One-click export distills patterns into structured instructions suitable for CLAUDE.md or system prompts.

**Rationale:** The ultimate compounding play. Each review cycle makes future agent output better, which means fewer comments, which means faster iteration. The tool gets smarter the more it's used — no ML required, just accumulation and surfacing. Closes the feedback loop between reviewing and prompting.

**Downsides:** Requires substantial comment history before patterns emerge. Only valuable for heavy users. Export quality depends on good heuristics. Premature if the archive (#3) isn't built first.

**Confidence:** 60%
**Complexity:** High (but incremental — each stage is independently useful)
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Kill the File: Live Shared Buffer | Requires fundamental architecture rewrite; too ambitious for current stage |
| 2 | Cross-File Comment Threading | High complexity, requires file panel first, niche use case at current scale |
| 3 | Comment Templates (standalone) | Low-leverage; folded into Quick Reactions in survivor #5 |
| 4 | Unreviewed Section Markers | Viewport tracking is unreliable; questionable value vs. implementation cost |
| 5 | Agent-Readable Review Summary Block | Marginal improvement over existing comment serialization |
| 6 | Agent-Aware Front Matter Protocol | Overlaps with section approvals and existing metadata; adds format complexity |
| 7 | Multi-File Plan Graph | Premature; simple file panel sufficient for now, natural future extension of #1 |
| 8 | Ghost Diff Preview Before Save | Subsumed by the provenance/diff layer (#2) which is always-on |
| 9 | Desktop Notifications (standalone) | Too simple standalone; folded into File Watch Panel (#1) |
| 10 | Auto-Reload on External Changes | Table stakes; folded into File Watch Panel (#1) as expected behavior |
| 11 | Conversation Thread Reframing | Too abstract; concrete version is #6 (Bidirectional Agent Conversation) |

## Session Log

- 2026-03-28: Initial ideation — 39 raw ideas generated across 5 frames (pain/friction, missing capabilities, inversion/automation, assumption-breaking, leverage/compounding), deduped to 18 unique, 7 survived adversarial filtering