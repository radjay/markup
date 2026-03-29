---
title: Markup v0.1 Manual Test Plan
date: 2026-03-29
---

# Markup v0.1 — Manual Test Plan

## Prerequisites

- macOS (the only target platform for v0.1)
- The app built and running via `npm run dev` or the packaged DMG
- A test fixtures directory containing the files described below

## Test Fixtures

Create these files in a test directory before starting:

1. **basic.md** — Simple markdown with headings, paragraphs, a list, code block, table, and blockquote. No frontmatter, no existing comments.
2. **with-comments.md** — Contains `<!-- @markup {...} -->` inline comments and `<!-- @markup-doc-comments -->` block, plus frontmatter with `markup_reviewed: true` and `markup_status: changes_requested`.
3. **empty.md** — Zero-byte file.
4. **frontmatter-only.md** — Only YAML frontmatter, no body.
5. **huge.md** — 10,000+ lines (repeated heading/paragraph blocks).
6. **special-chars.md** — Unicode, emoji, angle brackets, curly braces, backticks in headings, markdown special characters.
7. **malformed-comments.md** — Invalid JSON in `@markup` comments plus valid comments.
8. **readonly.md** — Normal markdown with `chmod 444`.
9. **nested-project/** — Git repo with `.gitignore` ignoring `build/` and `*.log`, containing `README.md`, `docs/plan.md`, `build/output.md`, `node_modules/dep/README.md`.

---

## 1. Welcome Screen

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Initial launch | Launch app with no arguments | Welcome screen with M↑ logo, tagline, Open File, Open Folder buttons, Cmd+O hint |
| 1.2 | Open File button | Click "Open File" | Native file dialog filtered to .md/.markdown. Cancel returns to welcome. |
| 1.3 | Open Folder button | Click "Open Folder", select `nested-project/` | App transitions to main layout with sidebar. Editor shows "Select a file from the sidebar." |
| 1.4 | Cmd+O from welcome | Press Cmd+O | File dialog opens |
| 1.5 | Drag .md onto welcome | Drag `basic.md` from Finder | File loads, welcome replaced by editor |
| 1.6 | Drag folder onto welcome | Drag `nested-project/` folder | Directory loads into sidebar |
| 1.7 | Drag non-markdown file | Drag a .txt or .png | Nothing happens, no crash |

## 2. File Opening and Rendering

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 2.1 | Render basic.md | Open `basic.md` | Literata headings, Inter body, JetBrains Mono code. Dark theme. Filename in titlebar. |
| 2.2 | File with existing comments | Open `with-comments.md` | Comments invisible in rendered output. Badges on anchored blocks. Doc comments in sidebar. |
| 2.3 | Empty file | Open `empty.md` | Empty pane, no crash. "No document-level comments yet." in sidebar. |
| 2.4 | Frontmatter-only file | Open `frontmatter-only.md` | Opens with empty body. No crash. |
| 2.5 | Large file | Open `huge.md` | Loads, scrolls smoothly, outline populated, app responsive |
| 2.6 | Special characters | Open `special-chars.md` | Unicode/emoji render correctly. Angle brackets handled. Backticks in headings work. |
| 2.7 | Malformed comments | Open `malformed-comments.md` | Malformed comments skipped silently. Valid comments still parse. No crash. |
| 2.8 | GFM features | Open file with GFM table, strikethrough, task lists, autolinks | All render correctly |

## 3. Inline Commenting

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | Click block to open panel | Click a paragraph in review mode | Block highlights. Comment panel appears below with textarea, anchor label, close button. |
| 3.2 | Submit via Cmd+Enter | Type comment, press Cmd+Enter | Comment appears in panel. Textarea clears. Unsaved dot appears. Badge shows 1. |
| 3.3 | Submit via button | Type comment, click "Comment" | Same as 3.2 |
| 3.4 | Button disabled when empty | Open panel, don't type / type only spaces | Button disabled |
| 3.5 | Multiple comments same block | Add two comments to same heading | Both visible. Badge shows 2. |
| 3.6 | Delete a comment | Click X on a comment | Comment removed. Badge decrements. |
| 3.7 | Close with Escape | Open panel, press Escape | Panel closes |
| 3.8 | Close with X button | Click X in panel header | Panel closes |
| 3.9 | Switch panels | Click block A, then block B | A's panel closes, B's opens |
| 3.10 | Click background to close | Click empty area in review mode | Panel closes |
| 3.11 | All block types commentable | Comment on h1, h2, h3, p, ul, ol, table, code block, blockquote | All nine types work |
| 3.12 | Inline code not commentable | Click inline `code` in a paragraph | No separate panel — comment at paragraph level |

## 4. Document-Level Comments

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | Add via Cmd+Enter | Type in doc comment textarea, press Cmd+Enter | Comment appears with timestamp. Unsaved dot. |
| 4.2 | Add via button | Type and click "Add Comment" | Same as 4.1 |
| 4.3 | Delete | Click X on a document comment | Removed |
| 4.4 | Empty state | Open file with no doc comments | "No document-level comments yet." |
| 4.5 | Multiple comments | Add three comments | All appear in order with timestamps |

## 5. Save and Comment Serialization

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1 | Save with Cmd+S | Add inline + doc comments, press Cmd+S | Dot disappears. File has `<!-- @markup -->` comments and frontmatter. |
| 5.2 | Save via menu | File > Save | Same as 5.1 |
| 5.3 | Save via button | Click Save button | Same as 5.1 |
| 5.4 | Button disabled with no changes | Open file without editing | Save button disabled |
| 5.5 | Round-trip: save and reopen | Add comments, save, close, reopen | All comments restored on correct blocks |
| 5.6 | Multiple inline comments round-trip | Comments on h1, paragraph, code block — save, reopen | All three re-associated correctly |
| 5.7 | Preserves existing frontmatter | File has `title: "My Plan"` — add comment, save | Original `title` preserved alongside `markup_*` fields |
| 5.8 | Doc-only comments set "commented" | Add only doc comments, save | `markup_status: commented` |
| 5.9 | Inline comments set "changes_requested" | Add inline comment, save | `markup_status: changes_requested` |
| 5.10 | Save to read-only file | Open `readonly.md`, add comment, Cmd+S | Save fails. App doesn't crash. Dot remains. **Known gap: no error UI.** |
| 5.11 | Comment with `-->` in body | Add comment containing `-->`, save, reopen | **Known gap: may break HTML comment.** Document behavior. |

## 6. Edit Mode

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 6.1 | Toggle to edit mode | Click "Edit" or Cmd+E | CodeMirror with markdown, line numbers, JetBrains Mono, dark theme |
| 6.2 | Toggle back to review | Click "Review" or Cmd+E | Rendered markdown reflects edits. Unsaved dot if content changed. |
| 6.3 | Edit and verify rendering | Add `## New Section` in edit, switch to review | New heading renders. Outline updates. Heading is commentable. |
| 6.4 | Edit mode shows clean content | Open `with-comments.md`, switch to edit | No `<!-- @markup -->` comments visible in editor |
| 6.5 | Unsaved indicator on edit | Edit, type one character, switch to review | Unsaved dot appears |
| 6.6 | Save from edit mode | Edit content, Cmd+S | Saves using edited content as base. Comments serialized on top. |
| 6.7 | Cmd+E from menu | View > Toggle Edit Mode | Mode toggles correctly |

## 7. Sidebar — File Tree

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 7.1 | Shows only .md files | Open `nested-project/` | Only .md files and directories containing them |
| 7.2 | Gitignore respected | Same directory | `build/output.md` hidden. `node_modules/` hidden. |
| 7.3 | Dotfiles hidden | Create `.hidden.md` in directory | Not shown |
| 7.4 | Empty directories hidden | Create empty `empty-dir/` | Not shown |
| 7.5 | Click file to open | Click `plan.md` | File loads, highlighted as active in tree |
| 7.6 | Expand/collapse directories | Click directory name | Toggles. Depth < 2 expanded by default. |
| 7.7 | "+" button | Click + next to "Files" | Directory picker opens |
| 7.8 | Depth limit | 7+ level deep directories | Stops at depth 5 |
| 7.9 | No unsaved prompt on switch | Add comment, click different file | **Known gap: switches silently, discards unsaved changes.** |

## 8. Sidebar — Outline

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 8.1 | Shows h1-h3 | File with h1-h5 | Only h1, h2, h3 in outline |
| 8.2 | Click to scroll | Click outline entry | Editor scrolls smoothly to heading |
| 8.3 | Indentation | Nested h1 > h2 > h3 | Visually indented by level |
| 8.4 | Updates on edit | Add heading in edit mode, switch back | Outline includes new heading |
| 8.5 | Empty for no headings | File with only paragraphs | Outline section not shown |
| 8.6 | Duplicate headings | Two `## Setup` headings | Both in outline. **Known: clicking either scrolls to first.** |

## 9. File Watching

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 9.1 | External modification | Open file, edit it in another editor | "Modified externally" bar appears |
| 9.2 | Reload button | Click Reload | File updates, bar disappears |
| 9.3 | Dismiss button | Click Dismiss | Bar disappears, stale content remains |
| 9.4 | External change with unsaved work | Add comment, file modified externally, Reload | **Unsaved comment lost. No warning. Known v0.1 behavior.** |

## 10. Keyboard Shortcuts & Menus

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 10.1 | Cmd+O | Press from any state | File dialog |
| 10.2 | Cmd+Shift+O | Press | Directory picker |
| 10.3 | Cmd+S | With unsaved changes | Saves, dot disappears |
| 10.4 | Cmd+E | While viewing a file | Toggle review/edit |
| 10.5 | Menu structure | Inspect menu bar | App, File, Edit, View, Window menus with correct items |
| 10.6 | Cmd+S with no file | On welcome screen | Nothing happens |

## 11. Drag and Drop

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 11.1 | Drop .md file | Drag onto main view | File loads |
| 11.2 | Drop folder | Drag onto app | Sidebar populated |
| 11.3 | Drop non-markdown | Drag .txt/.png | Nothing happens |
| 11.4 | Drop multiple files | Drag two .md files | Only first processed |

## 12. Cross-Feature Interactions

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 12.1 | Comments survive edit toggle | Add comments, toggle edit, toggle review | Comments still present |
| 12.2 | Edit + save with comments | Add comment, edit content, save, reopen | Both edits and comments preserved |
| 12.3 | Edit heading with comment | Comment on heading, edit heading text, save, reopen | **Known: anchor mismatch may misplace comment** |
| 12.4 | Doc comments in edit mode | Switch to edit, add doc comment | Works — sidebar functional in edit mode |
| 12.5 | File switch resets to review | Enter edit on file A, click file B | File B opens in review mode |

## 13. Claude Code Plugin

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 13.1 | Plugin files exist | Check `plugin/CLAUDE.md` and `plugin/skill.md` | Both present with clear instructions |
| 13.2 | Inline comments parseable | Save file with comments, inspect | Valid HTML comments with parseable JSON metadata |
| 13.3 | Doc comments parseable | Inspect `@markup-doc-comments` block | Each line is valid JSON |
| 13.4 | Frontmatter metadata | Inspect saved frontmatter | `markup_reviewed`, `markup_reviewed_at`, `markup_status` present |
| 13.5 | Agent removes comments | Remove all `@markup` blocks, reopen in Markup | Clean file, no comments shown |

## 14. Error Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 14.1 | Directory with no .md files | Open such a directory | "No markdown files found." in sidebar |
| 14.2 | Save failure silent | Make file read-only, try save | **Known gap: no error UI. Dot remains.** |
| 14.3 | CRLF line endings | Open file with `\r\n` | Renders and saves correctly |
| 14.4 | No trailing newline | Open file without final `\n` | No formatting artifacts |

## 15. Build & Packaging

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 15.1 | Dev mode | `npm run dev` | App launches, HMR works |
| 15.2 | Production build | `npm run build` | Completes, output in `out/` |
| 15.3 | DMG packaging | `npm run dist` | DMG created in `release/` with correct icon |
| 15.4 | Install from DMG | Mount DMG, drag to Applications, launch | All features work |

---

## Known Gaps (v0.1)

1. **No unsaved-changes prompt on file switch** — switching files discards unsaved comments silently
2. **Save failure is silent** — no error UI when write fails
3. **`-->` in comment body breaks serialization** — prematurely closes HTML comment
4. **Duplicate heading IDs** — outline click scrolls to first match only
5. **Anchor mismatch after heading edit** — comment may misplace after heading text changes
6. **No error handling on file select** — if file is deleted between listing and clicking, unhandled rejection
7. **Outline scroll doesn't work in edit mode** — queries `.review-mode` DOM which doesn't exist in edit mode
