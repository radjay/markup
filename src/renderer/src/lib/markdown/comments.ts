import type { InlineComment, DocumentComment, ParsedDocument } from '../../../../shared/types'
import matter from 'gray-matter'
import { nanoid } from 'nanoid'

const INLINE_COMMENT_RE =
  /<!--\s*@markup\s+(\{[^}]+\})\s*([\s\S]*?)\s*-->/g

const DOC_COMMENTS_RE =
  /<!--\s*@markup-doc-comments\s*\n([\s\S]*?)\n\s*-->/g

export function parseComments(raw: string): ParsedDocument {
  const { data: frontmatter, content: bodyWithComments } = matter(raw)

  const inlineComments: InlineComment[] = []
  const documentComments: DocumentComment[] = []

  // Extract inline comments
  let match: RegExpExecArray | null
  const inlineRe = new RegExp(INLINE_COMMENT_RE.source, 'g')
  while ((match = inlineRe.exec(bodyWithComments)) !== null) {
    try {
      const meta = JSON.parse(match[1])
      inlineComments.push({
        id: meta.id || nanoid(),
        type: 'inline',
        anchor: meta.anchor || '',
        selection: meta.selection,
        author: meta.author || 'unknown',
        ts: meta.ts || new Date().toISOString(),
        body: match[2].trim()
      })
    } catch {
      // Malformed comment — skip but preserve in file
    }
  }

  // Extract document-level comments
  const docRe = new RegExp(DOC_COMMENTS_RE.source, 'g')
  while ((match = docRe.exec(bodyWithComments)) !== null) {
    const lines = match[1].trim().split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed)
        documentComments.push({
          id: parsed.id || nanoid(),
          type: 'document',
          author: parsed.author || 'unknown',
          ts: parsed.ts || new Date().toISOString(),
          body: parsed.body || ''
        })
      } catch {
        // Malformed line — skip
      }
    }
  }

  // Strip comments from content for clean rendering
  const content = bodyWithComments
    .replace(inlineRe, '')
    .replace(new RegExp(DOC_COMMENTS_RE.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const reviewMetadata = frontmatter.markup_reviewed
    ? {
        markup_reviewed: frontmatter.markup_reviewed,
        markup_reviewer: frontmatter.markup_reviewer,
        markup_reviewed_at: frontmatter.markup_reviewed_at,
        markup_status: frontmatter.markup_status
      }
    : null

  return { content, frontmatter, inlineComments, documentComments, reviewMetadata }
}

export function serializeComments(
  originalRaw: string,
  inlineComments: InlineComment[],
  documentComments: DocumentComment[],
  reviewer: string
): string {
  // Parse frontmatter from original
  const { data: frontmatter, content: body } = matter(originalRaw)

  // Strip any existing @markup comments from body
  const inlineRe = new RegExp(INLINE_COMMENT_RE.source, 'g')
  const docRe = new RegExp(DOC_COMMENTS_RE.source, 'g')
  let cleanBody = body.replace(inlineRe, '').replace(docRe, '').replace(/\n{3,}/g, '\n\n').trim()

  // Insert inline comments after their anchor headings
  if (inlineComments.length > 0) {
    const lines = cleanBody.split('\n')
    const insertions: Map<number, string[]> = new Map()

    for (const comment of inlineComments) {
      // Find the heading line that matches the anchor
      let bestLine = -1
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
        if (trimmed === comment.anchor) {
          bestLine = i
        }
      }

      if (bestLine === -1) {
        // No matching heading — find the next blank line after start or append at end
        bestLine = lines.length - 1
      }

      // Find the end of the section (next heading or end of content under this heading)
      let insertAt = bestLine + 1
      while (insertAt < lines.length && !lines[insertAt].trim().startsWith('#')) {
        insertAt++
      }
      // Back up to just before the next heading
      insertAt = Math.max(bestLine + 1, insertAt - 1)

      // Find last non-empty line in the section
      let lastContent = insertAt
      for (let j = insertAt; j > bestLine; j--) {
        if (lines[j] && lines[j].trim() !== '') {
          lastContent = j
          break
        }
      }

      const meta: Record<string, unknown> = {
        id: comment.id,
        type: 'inline',
        anchor: comment.anchor,
        author: comment.author,
        ts: comment.ts
      }
      if (comment.selection) meta.selection = comment.selection

      const commentStr = `<!-- @markup ${JSON.stringify(meta)} ${comment.body} -->`

      const existing = insertions.get(lastContent) || []
      existing.push(commentStr)
      insertions.set(lastContent, existing)
    }

    // Insert comments from bottom to top to preserve line numbers
    const sortedInsertions = Array.from(insertions.entries()).sort((a, b) => b[0] - a[0])
    for (const [lineIdx, comments] of sortedInsertions) {
      lines.splice(lineIdx + 1, 0, ...comments)
    }

    cleanBody = lines.join('\n')
  }

  // Append document-level comments at the end
  if (documentComments.length > 0) {
    const docLines = documentComments.map((c) =>
      JSON.stringify({ id: c.id, type: 'document', author: c.author, ts: c.ts, body: c.body })
    )
    cleanBody += `\n\n<!-- @markup-doc-comments\n${docLines.join('\n')}\n-->`
  }

  // Update frontmatter with review metadata
  const hasComments = inlineComments.length > 0 || documentComments.length > 0
  if (hasComments) {
    frontmatter.markup_reviewed = true
    frontmatter.markup_reviewer = reviewer
    frontmatter.markup_reviewed_at = new Date().toISOString()
    frontmatter.markup_status =
      inlineComments.length > 0 ? 'changes_requested' : 'commented'
  }

  return matter.stringify(cleanBody, frontmatter)
}

export function createInlineComment(anchor: string, body: string, author: string): InlineComment {
  return {
    id: nanoid(),
    type: 'inline',
    anchor,
    author,
    ts: new Date().toISOString(),
    body
  }
}

export function createDocumentComment(body: string, author: string): DocumentComment {
  return {
    id: nanoid(),
    type: 'document',
    author,
    ts: new Date().toISOString(),
    body
  }
}
