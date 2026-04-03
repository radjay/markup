import { useState, useRef, useEffect, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface Props {
  anchor: string
  comments: InlineCommentType[]
  onSubmit: (body: string) => void
  onClose: () => void
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
}

export function InlineComment({ anchor, comments, onSubmit, onClose, onEdit, onDelete }: Props) {
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const mountedRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Only focus on initial mount, not on re-renders (which would scroll back)
    if (!mountedRef.current) {
      mountedRef.current = true
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [])

  // Refocus when exiting edit mode
  const prevEditingRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevEditingRef.current && !editingId) {
      inputRef.current?.focus({ preventScroll: true })
    }
    prevEditingRef.current = editingId
  }, [editingId])

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

  const startEdit = (comment: InlineCommentType) => {
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
                    ref={useCallback((el: HTMLTextAreaElement | null) => {
                      el?.focus({ preventScroll: true })
                    }, [])}
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
