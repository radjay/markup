import { useState, useCallback, useMemo, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { InlineComment } from './InlineComment'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface Props {
  content: string
  inlineComments: InlineCommentType[]
  onAddComment: (anchor: string, body: string) => void
  onEditComment: (id: string, body: string) => void
  onDeleteComment: (id: string) => void
}

function blockAnchor(tag: string, children: ReactNode): string {
  const text = extractText(children).slice(0, 80).trim()
  return `${tag}:${text}`
}

function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as { props: { children: ReactNode } }).props.children)
  }
  return ''
}

interface EditDraft {
  id: string
  text: string
}

export function ReviewMode({ content, inlineComments, onAddComment, onEditComment, onDeleteComment }: Props) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)

  // Lifted draft state: keyed by anchor
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({})
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({})

  const handleBlockClick = useCallback((anchor: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAnchor((prev) => (prev === anchor ? null : anchor))
  }, [])

  const handleSubmitComment = useCallback(
    (body: string) => {
      if (activeAnchor) {
        onAddComment(activeAnchor, body)
        // Clear draft after submit
        setDraftTexts((prev) => {
          const next = { ...prev }
          delete next[activeAnchor]
          return next
        })
      }
    },
    [activeAnchor, onAddComment]
  )

  const handleClose = useCallback(() => {
    if (activeAnchor) {
      // Clear draft on close
      setDraftTexts((prev) => {
        const next = { ...prev }
        delete next[activeAnchor]
        return next
      })
      setEditDrafts((prev) => {
        const next = { ...prev }
        delete next[activeAnchor]
        return next
      })
    }
    setActiveAnchor(null)
  }, [activeAnchor])

  const handleDraftChange = useCallback((anchor: string, text: string) => {
    setDraftTexts((prev) => ({ ...prev, [anchor]: text }))
  }, [])

  const handleEditStart = useCallback((anchor: string, id: string, text: string) => {
    setEditDrafts((prev) => ({ ...prev, [anchor]: { id, text } }))
  }, [])

  const handleEditChange = useCallback((anchor: string, text: string) => {
    setEditDrafts((prev) => {
      const existing = prev[anchor]
      if (!existing) return prev
      return { ...prev, [anchor]: { ...existing, text } }
    })
  }, [])

  const handleEditSave = useCallback(
    (anchor: string) => {
      const draft = editDrafts[anchor]
      if (draft && draft.text.trim()) {
        onEditComment(draft.id, draft.text.trim())
        setEditDrafts((prev) => {
          const next = { ...prev }
          delete next[anchor]
          return next
        })
      }
    },
    [editDrafts, onEditComment]
  )

  const handleEditCancel = useCallback((anchor: string) => {
    setEditDrafts((prev) => {
      const next = { ...prev }
      delete next[anchor]
      return next
    })
  }, [])

  const getCommentsForAnchor = useCallback(
    (anchor: string) => inlineComments.filter((c) => c.anchor === anchor),
    [inlineComments]
  )

  // Pre-compute cumulative badge numbers per anchor
  const commentCountMap = useMemo(() => {
    const map = new Map<string, number>()
    let counter = 0
    // Collect unique anchors in order they appear
    const anchors: string[] = []
    inlineComments.forEach((c) => {
      if (anchors.indexOf(c.anchor) === -1) {
        anchors.push(c.anchor)
      }
    })
    anchors.forEach((anchor) => {
      const count = inlineComments.filter((c) => c.anchor === anchor).length
      counter += count
      map.set(anchor, counter)
    })
    return map
  }, [inlineComments])

  // Memoized render function for commentable blocks
  const renderBlock = useCallback(
    (anchor: string, children: ReactNode) => {
      const comments = getCommentsForAnchor(anchor)
      const isActive = activeAnchor === anchor
      const hasComments = comments.length > 0
      const badgeNumber = commentCountMap.get(anchor) ?? 0

      return (
        <div
          className={`commentable-block ${isActive ? 'active' : ''} ${hasComments ? 'has-comments' : ''}`}
          onClick={(e) => handleBlockClick(anchor, e)}
        >
          {hasComments && !isActive && (
            <span className="comment-badge">{badgeNumber}</span>
          )}
          {children}
          {isActive && (
            <InlineComment
              anchor={anchor}
              comments={comments}
              draftText={draftTexts[anchor] ?? ''}
              onDraftChange={(text) => handleDraftChange(anchor, text)}
              editDraft={editDrafts[anchor] ?? null}
              onEditStart={(id, text) => handleEditStart(anchor, id, text)}
              onEditChange={(text) => handleEditChange(anchor, text)}
              onEditSave={() => handleEditSave(anchor)}
              onEditCancel={() => handleEditCancel(anchor)}
              onSubmit={handleSubmitComment}
              onClose={handleClose}
              onDelete={onDeleteComment}
            />
          )}
        </div>
      )
    },
    [
      activeAnchor, commentCountMap, draftTexts, editDrafts,
      getCommentsForAnchor, handleBlockClick, handleSubmitComment, handleClose,
      handleDraftChange, handleEditStart, handleEditChange, handleEditSave, handleEditCancel,
      onDeleteComment
    ]
  )

  // Memoize ReactMarkdown components for stable references
  const markdownComponents = useMemo(
    () => ({
      h1: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('h1', children), <h1 {...props}>{children}</h1>),
      h2: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('h2', children), <h2 {...props}>{children}</h2>),
      h3: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('h3', children), <h3 {...props}>{children}</h3>),
      p: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('p', children), <p {...props}>{children}</p>),
      blockquote: ({ children, ...props }: any) =>
        renderBlock(
          blockAnchor('blockquote', children),
          <blockquote {...props}>{children}</blockquote>
        ),
      ul: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('ul', children), <ul {...props}>{children}</ul>),
      ol: ({ children, ...props }: any) =>
        renderBlock(blockAnchor('ol', children), <ol {...props}>{children}</ol>),
      table: ({ children, ...props }: any) =>
        renderBlock(
          blockAnchor('table', children),
          <div className="table-wrapper">
            <table {...props}>{children}</table>
          </div>
        ),
      code: ({ className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '')
        const isBlock = match || (typeof children === 'string' && children.includes('\n'))
        if (isBlock) {
          return renderBlock(
            blockAnchor('code', children),
            <pre className={`code-block ${className || ''}`}>
              <code {...props}>{children}</code>
            </pre>
          )
        }
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        )
      }
    }),
    [renderBlock]
  )

  return (
    <div className="review-mode" onClick={() => setActiveAnchor(null)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
