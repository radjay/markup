import { useState, useRef, useEffect } from 'react'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface Props {
  anchor: string
  comments: InlineCommentType[]
  onSubmit: (body: string) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export function InlineComment({ anchor, comments, onSubmit, onClose, onDelete }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="inline-comment-panel" onClick={(e) => e.stopPropagation()}>
      <div className="comment-panel-header">
        <span className="comment-anchor-label">{anchor}</span>
        <button className="comment-close" onClick={onClose}>
          &times;
        </button>
      </div>

      {comments.length > 0 && (
        <div className="existing-comments">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">
                  {new Date(c.ts).toLocaleString()}
                </span>
                <button
                  className="comment-delete"
                  onClick={() => onDelete(c.id)}
                  title="Delete comment"
                >
                  &times;
                </button>
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))}
        </div>
      )}

      <div className="comment-input-area">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={3}
        />
        <div className="comment-actions">
          <span className="comment-hint">Cmd+Enter to submit</span>
          <button onClick={handleSubmit} disabled={!text.trim()} className="comment-submit">
            Comment
          </button>
        </div>
      </div>
    </div>
  )
}
