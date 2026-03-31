import type { InlineComment, DocumentComment, ParsedDocument } from '../../../../shared/types'
import { nanoid } from 'nanoid'

// Escape/unescape --> in comment bodies to prevent breaking HTML comment syntax
function escapeCommentBody(body: string): string {
  return body.replace(/-->/g, '--&gt;')
}

function unescapeCommentBody(body: string): string {
  return body.replace(/--&gt;/g, '-->')
}

const INLINE_COMMENT_RE =
  /<!--\s*@markup\s+(\{[^}]+\})\s*([\s\S]*?)\s*-->/g

const DOC_COMMENTS_RE =
  /<!--\s*@markup-doc-comments\s*\n([\s\S]*?)\n\s*-->/g

// Simple frontmatter parser (no Buffer dependency like gray-matter)
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return { data: {}, body: raw }

  const yamlStr = match[1]
  const body = raw.slice(match[0].length)
  const data: Record<string, unknown> = {}

  // Parse simple YAML key: value pairs
  for (const line of yamlStr.split('\n')) {
    const kv = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/)
    if (kv) {
      let val: unknown = kv[2].trim()
      // Remove surrounding quotes
      if ((val as string).startsWith('"') && (val as string).endsWith('"')) {
        val = (val as string).slice(1, -1)
      }
      if (val === 'true') val = true
      else if (val === 'false') val = false
      data[kv[1]] = val
    }
  }

  return { data, body }
}

function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  const keys = Object.keys(data)
  if (keys.length === 0) return body

  const lines = keys.map((k) => {
    const v = data[k]
    if (typeof v === 'string') return `${k}: "${v}"`
    return `${k}: ${v}`
  })

  return `---\n${lines.join('\n')}\n---\n${body}`
}

export function parseComments(raw: string): ParsedDocument {
  const { data: frontmatter, body: bodyWithComments } = parseFrontmatter(raw)

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
        author: meta.author || '',
        ts: meta.ts || new Date().toISOString(),
        body: unescapeCommentBody(match[2].trim())
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
          author: parsed.author || '',
          ts: parsed.ts || new Date().toISOString(),
          body: unescapeCommentBody(parsed.body || '')
        })
      } catch {
        // Malformed line — skip
      }
    }
  }

  // Strip comments from content for clean rendering
  const content = bodyWithComments
    .replace(new RegExp(INLINE_COMMENT_RE.source, 'g'), '')
    .replace(new RegExp(DOC_COMMENTS_RE.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const reviewMetadata = frontmatter.markup_reviewed
    ? {
        markup_reviewed: frontmatter.markup_reviewed as boolean,
        markup_reviewer: frontmatter.markup_reviewer as string,
        markup_reviewed_at: frontmatter.markup_reviewed_at as string,
        markup_status: frontmatter.markup_status as 'approved' | 'changes_requested' | 'commented'
      }
    : null

  return { content, frontmatter, inlineComments, documentComments, reviewMetadata }
}

export function serializeComments(
  originalRaw: string,
  inlineComments: InlineComment[],
  documentComments: DocumentComment[]
): string {
  const { data: frontmatter, body } = parseFrontmatter(originalRaw)

  // Strip any existing @markup comments from body
  let cleanBody = body
    .replace(new RegExp(INLINE_COMMENT_RE.source, 'g'), '')
    .replace(new RegExp(DOC_COMMENTS_RE.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Insert inline comments after lines that match their anchor content
  if (inlineComments.length > 0) {
    const lines = cleanBody.split('\n')
    const insertions: Map<number, string[]> = new Map()

    for (const comment of inlineComments) {
      const anchorText = comment.anchor.replace(/^(h[1-6]|p|blockquote|ul|ol|table|code):/, '')
      let bestLine = -1

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
          .replace(/^#{1,6}\s+/, '')
          .replace(/^\*\*/, '').replace(/\*\*$/, '')
          .replace(/^>\s*/, '')

        if (anchorText && trimmed.startsWith(anchorText.slice(0, 40))) {
          bestLine = i
          break
        }
      }

      if (bestLine === -1) {
        bestLine = lines.length - 1
      }

      // Find end of this block
      let insertAt = bestLine
      if (comment.anchor.startsWith('h')) {
        insertAt = bestLine
      } else {
        for (let j = bestLine + 1; j < lines.length; j++) {
          if (lines[j].trim() === '' || lines[j].trim().startsWith('#')) {
            insertAt = j - 1
            break
          }
          insertAt = j
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

      const commentStr = `<!-- @markup ${JSON.stringify(meta)} ${escapeCommentBody(comment.body)} -->`
      const existing = insertions.get(insertAt) || []
      existing.push(commentStr)
      insertions.set(insertAt, existing)
    }

    const sorted = Array.from(insertions.entries()).sort((a, b) => b[0] - a[0])
    for (const [lineIdx, comments] of sorted) {
      lines.splice(lineIdx + 1, 0, ...comments)
    }

    cleanBody = lines.join('\n')
  }

  // Append document-level comments at the end
  if (documentComments.length > 0) {
    const docLines = documentComments.map((c) =>
      JSON.stringify({ id: c.id, type: 'document', author: c.author, ts: c.ts, body: escapeCommentBody(c.body) })
    )
    cleanBody += `\n\n<!-- @markup-doc-comments\n${docLines.join('\n')}\n-->`
  }

  // Update frontmatter with review metadata
  const hasComments = inlineComments.length > 0 || documentComments.length > 0
  if (hasComments) {
    frontmatter.markup_reviewed = true
    frontmatter.markup_reviewed_at = new Date().toISOString()
    frontmatter.markup_status =
      inlineComments.length > 0 ? 'changes_requested' : 'commented'
  }

  return stringifyFrontmatter(frontmatter, cleanBody)
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
