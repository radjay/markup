import { useState } from 'react'
import type { DocumentComment } from '../../../../shared/types'

interface Props {
  comments: DocumentComment[]
  onAdd: (body: string) => void
  onDelete: (id: string) => void
}

export function DocumentComments({ comments, onAdd, onDelete }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) {
      onAdd(trimmed)
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="document-comments">
      <h3 className="panel-title">Document Comments</h3>

      <div className="comments-list">
        {comments.length === 0 && (
          <p className="no-comments">No document-level comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-meta">
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

      <div className="doc-comment-input">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a document comment..."
          rows={3}
        />
        <button onClick={handleSubmit} disabled={!text.trim()} className="comment-submit">
          Add Comment
        </button>
      </div>
    </div>
  )
}
