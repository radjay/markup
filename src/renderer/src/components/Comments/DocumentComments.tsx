import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { DocumentComment } from '../../../../shared/types'

interface Props {
  comments: DocumentComment[]
  onAdd: (body: string) => void
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
}

export function DocumentComments({ comments, onAdd, onEdit, onDelete }: Props) {
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

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

  const startEdit = (comment: DocumentComment) => {
    setEditingId(comment.id)
    setEditText(comment.body)
  }

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onEdit(editingId, editText.trim())
      setEditingId(null)
      setEditText('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div className="document-comments">
      <h3 className="panel-title">Document Comments</h3>

      <div className="comments-list">
        {comments.length === 0 && (
          <p className="no-comments">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-meta">
              <span className="comment-time">
                {new Date(c.ts).toLocaleString()}
              </span>
              <div className="comment-item-actions">
                <button
                  className="comment-edit"
                  onClick={() => startEdit(c)}
                  title="Edit comment"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="comment-delete"
                  onClick={() => onDelete(c.id)}
                  title="Delete comment"
                >
                  &times;
                </button>
              </div>
            </div>
            {editingId === c.id ? (
              <div className="comment-edit-area">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={2}
                  autoFocus
                />
                <div className="comment-edit-actions">
                  <button onClick={cancelEdit} className="comment-edit-cancel">Cancel</button>
                  <button onClick={saveEdit} disabled={!editText.trim()} className="comment-submit">Save</button>
                </div>
              </div>
            ) : (
              <div className="comment-body">{c.body}</div>
            )}
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
