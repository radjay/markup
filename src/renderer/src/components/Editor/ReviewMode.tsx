import { useState, useCallback, type ReactNode } from 'react'
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

export function ReviewMode({ content, inlineComments, onAddComment, onEditComment, onDeleteComment }: Props) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)

  const handleBlockClick = useCallback((anchor: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAnchor((prev) => (prev === anchor ? null : anchor))
  }, [])

  const handleSubmitComment = useCallback(
    (body: string) => {
      if (activeAnchor) {
        onAddComment(activeAnchor, body)
        // Keep the panel open so user can see their comment was added
      }
    },
    [activeAnchor, onAddComment]
  )

  const getCommentsForAnchor = useCallback(
    (anchor: string) => inlineComments.filter((c) => c.anchor === anchor),
    [inlineComments]
  )

  // Track sequential comment numbering across the document
  let commentCounter = 0

  // Render a commentable wrapper around a block element
  const renderBlock = (anchor: string, children: ReactNode) => {
    const comments = getCommentsForAnchor(anchor)
    const isActive = activeAnchor === anchor
    const hasComments = comments.length > 0

    // Assign sequential number for this block's comments
    let badgeNumber = 0
    if (hasComments) {
      commentCounter += comments.length
      badgeNumber = commentCounter
    }

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
            onSubmit={handleSubmitComment}
            onClose={() => setActiveAnchor(null)}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
        )}
      </div>
    )
  }

  return (
    <div className="review-mode" onClick={() => setActiveAnchor(null)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }) =>
            renderBlock(blockAnchor('h1', children), <h1 {...props}>{children}</h1>),
          h2: ({ children, ...props }) =>
            renderBlock(blockAnchor('h2', children), <h2 {...props}>{children}</h2>),
          h3: ({ children, ...props }) =>
            renderBlock(blockAnchor('h3', children), <h3 {...props}>{children}</h3>),
          p: ({ children, ...props }) =>
            renderBlock(blockAnchor('p', children), <p {...props}>{children}</p>),
          blockquote: ({ children, ...props }) =>
            renderBlock(
              blockAnchor('blockquote', children),
              <blockquote {...props}>{children}</blockquote>
            ),
          ul: ({ children, ...props }) =>
            renderBlock(blockAnchor('ul', children), <ul {...props}>{children}</ul>),
          ol: ({ children, ...props }) =>
            renderBlock(blockAnchor('ol', children), <ol {...props}>{children}</ol>),
          table: ({ children, ...props }) =>
            renderBlock(
              blockAnchor('table', children),
              <div className="table-wrapper">
                <table {...props}>{children}</table>
              </div>
            ),
          code: ({ className, children, ...props }) => {
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
