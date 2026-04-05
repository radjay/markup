import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface EditDraft {
  id: string
  text: string
}

interface Props {
  anchor: string
  comments: InlineCommentType[]
  initialDraftText: string
  onDraftChange: (text: string) => void
  initialEditDraft: EditDraft | null
  onEditStart: (id: string, text: string) => void
  onEditChange: (text: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onSubmit: (body: string) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export function InlineComment({
  anchor, comments, initialDraftText, onDraftChange,
  initialEditDraft, onEditStart, onEditChange, onEditSave, onEditCancel,
  onSubmit, onClose, onDelete
}: Props) {
  // Local display state — initialized from parent refs, synced back on change
  const [text, setText] = useState(initialDraftText)
  const [editingId, setEditingId] = useState<string | null>(initialEditDraft?.id ?? null)
  const [editText, setEditText] = useState(initialEditDraft?.text ?? '')

  const mountedRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true })
        if (text) {
          inputRef.current.selectionStart = text.length
          inputRef.current.selectionEnd = text.length
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refocus when exiting edit mode
  const prevEditingRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevEditingRef.current && !editingId) {
      inputRef.current?.focus({ preventScroll: true })
    }
    prevEditingRef.current = editingId
  }, [editingId])

  const handleTextChange = (value: string) => {
    setText(value)
    onDraftChange(value) // sync to parent ref (no re-render)
  }

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
    onEditStart(comment.id, comment.body) // sync to parent ref
  }

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onEditSave()
      setEditingId(null)
      setEditText('')
    }
  }

  const cancelEdit = () => {
    onEditCancel()
    setEditingId(null)
    setEditText('')
  }

  const handleEditTextChange = (value: string) => {
    setEditText(value)
    onEditChange(value) // sync to parent ref
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
                    onChange={(e) => handleEditTextChange(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={2}
                    ref={(el) => el?.focus({ preventScroll: true })}
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
          onChange={(e) => handleTextChange(e.target.value)}
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
