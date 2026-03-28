import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { InlineComment } from './InlineComment'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface Props {
  content: string
  inlineComments: InlineCommentType[]
  onAddComment: (anchor: string, body: string) => void
  onDeleteComment: (id: string) => void
}

export function ReviewMode({ content, inlineComments, onAddComment, onDeleteComment }: Props) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)

  const handleHeadingClick = useCallback((anchor: string) => {
    setActiveAnchor((prev) => (prev === anchor ? null : anchor))
  }, [])

  const handleSubmitComment = useCallback(
    (body: string) => {
      if (activeAnchor) {
        onAddComment(activeAnchor, body)
        setActiveAnchor(null)
      }
    },
    [activeAnchor, onAddComment]
  )

  const getCommentsForAnchor = (anchor: string) =>
    inlineComments.filter((c) => c.anchor === anchor)

  return (
    <div className="review-mode">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }) => {
            const anchor = `# ${extractText(children)}`
            const comments = getCommentsForAnchor(anchor)
            return (
              <div className="heading-wrapper">
                <h1
                  {...props}
                  className={`commentable ${activeAnchor === anchor ? 'active' : ''}`}
                  onClick={() => handleHeadingClick(anchor)}
                >
                  {children}
                  {comments.length > 0 && (
                    <span className="comment-badge">{comments.length}</span>
                  )}
                </h1>
                {activeAnchor === anchor && (
                  <InlineComment
                    anchor={anchor}
                    comments={comments}
                    onSubmit={handleSubmitComment}
                    onClose={() => setActiveAnchor(null)}
                    onDelete={onDeleteComment}
                  />
                )}
              </div>
            )
          },
          h2: ({ children, ...props }) => {
            const anchor = `## ${extractText(children)}`
            const comments = getCommentsForAnchor(anchor)
            return (
              <div className="heading-wrapper">
                <h2
                  {...props}
                  className={`commentable ${activeAnchor === anchor ? 'active' : ''}`}
                  onClick={() => handleHeadingClick(anchor)}
                >
                  {children}
                  {comments.length > 0 && (
                    <span className="comment-badge">{comments.length}</span>
                  )}
                </h2>
                {activeAnchor === anchor && (
                  <InlineComment
                    anchor={anchor}
                    comments={comments}
                    onSubmit={handleSubmitComment}
                    onClose={() => setActiveAnchor(null)}
                    onDelete={onDeleteComment}
                  />
                )}
              </div>
            )
          },
          h3: ({ children, ...props }) => {
            const anchor = `### ${extractText(children)}`
            const comments = getCommentsForAnchor(anchor)
            return (
              <div className="heading-wrapper">
                <h3
                  {...props}
                  className={`commentable ${activeAnchor === anchor ? 'active' : ''}`}
                  onClick={() => handleHeadingClick(anchor)}
                >
                  {children}
                  {comments.length > 0 && (
                    <span className="comment-badge">{comments.length}</span>
                  )}
                </h3>
                {activeAnchor === anchor && (
                  <InlineComment
                    anchor={anchor}
                    comments={comments}
                    onSubmit={handleSubmitComment}
                    onClose={() => setActiveAnchor(null)}
                    onDelete={onDeleteComment}
                  />
                )}
              </div>
            )
          },
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isBlock = match || (typeof children === 'string' && children.includes('\n'))
            if (isBlock) {
              return (
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
          },
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as { props: { children: React.ReactNode } }).props.children)
  }
  return String(children ?? '')
}
