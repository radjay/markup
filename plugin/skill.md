# Markup Review

Parse and present review feedback from Markup comments in markdown files.

## Usage

When a markdown file contains `@markup` comments (left by a human reviewer using the Markup editor), this skill extracts and presents them as structured feedback.

## Trigger

Activate when:
- User asks to "check markup comments", "read review feedback", or "address markup feedback"
- A markdown file contains `<!-- @markup` HTML comments
- A file's frontmatter contains `markup_status: changes_requested`

## Behavior

1. Read the specified markdown file (or scan recent `.md` files for `@markup` comments)
2. Extract all inline `@markup` comments and `@markup-doc-comments` blocks
3. Parse the frontmatter for `markup_reviewed`, `markup_status`, `markup_reviewed_at`
4. Present structured feedback:

```
## Review Feedback for [filename]
Status: [markup_status]
Reviewed: [markup_reviewed_at]

### Inline Comments
1. **[anchor]** — "comment text"
2. **[anchor]** — "comment text"

### Document Comments
1. "comment text"
2. "comment text"
```

5. For each comment, update the relevant section to address the feedback
6. Remove addressed `@markup` comment blocks
7. Remove the `@markup-doc-comments` block once all are addressed
8. Update frontmatter: set `markup_status` to `approved` if all comments resolved

## Example

Input file with comments:
```markdown
---
markup_status: changes_requested
---
## API Design
Rate limiting is global.
<!-- @markup {"id":"c1","type":"inline","anchor":"h2:API Design"} Rate limiting should be per-endpoint, not global -->
```

After addressing:
```markdown
---
markup_status: approved
---
## API Design
Rate limiting is configured per-endpoint with individual thresholds.
```
