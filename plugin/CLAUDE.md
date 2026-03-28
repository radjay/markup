# Markup Comments

When you encounter HTML comments in markdown files matching the pattern `<!-- @markup {...} ... -->`, these are review comments left by a human using the Markup editor. Your job is to address this feedback.

## Comment Format

### Inline comments
Appear after the content they reference:
```
<!-- @markup {"id":"...","type":"inline","anchor":"h2:Architecture","author":"...","ts":"..."} The comment text here -->
```

The `anchor` field tells you which section the comment targets. The format is `tag:content` where tag is h1/h2/h3/p/table/code/etc.

### Document-level comments
Appear at the end of the file in a block:
```
<!-- @markup-doc-comments
{"id":"...","type":"document","author":"...","ts":"...","body":"General feedback here"}
{"id":"...","type":"document","author":"...","ts":"...","body":"Another comment"}
-->
```

### Review metadata
In the YAML frontmatter:
```yaml
markup_reviewed: true
markup_reviewed_at: "2026-03-28T10:36:00Z"
markup_status: changes_requested  # or: approved, commented
```

## How to handle them

1. Parse each `@markup` comment to understand the feedback
2. Address inline comments by updating the relevant section
3. Address document-level comments by making the requested changes
4. **Remove each `@markup` inline comment once you've addressed it**
5. **Remove the `@markup-doc-comments` block once all document comments are addressed**
6. Update `markup_status` to reflect the current state
7. Preserve any frontmatter fields prefixed with `markup_`

## Example workflow

If a file contains:
```markdown
## Database Layer

We'll use SQLite for storage.
<!-- @markup {"id":"c1","type":"inline","anchor":"h2:Database Layer",...} SQLite won't scale. Use PostgreSQL instead. -->
```

You should:
1. Change "SQLite" to "PostgreSQL" in the section
2. Remove the `<!-- @markup ... -->` comment
3. The result should be clean markdown with the feedback incorporated
