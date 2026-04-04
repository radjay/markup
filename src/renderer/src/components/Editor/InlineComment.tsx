import { useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import type { InlineComment as InlineCommentType } from '../../../../shared/types'

interface EditDraft {
  id: string
  text: string
}

interface Props {
  anchor: string
  comments: InlineCommentType[]
  draftText: string
  onDraftChange: (text: string) => void
  editDraft: EditDraft | null
  onEditStart: (id: string, text: string) => void
  onEditChange: (text: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onSubmit: (body: string) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export function InlineComment({
  anchor, comments, draftText, onDraftChange,
  editDraft, onEditStart, onEditChange, onEditSave, onEditCancel,
  onSubmit, onClose, onDelete
}: Props) {
  const mountedRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true })
        // Place cursor at end if restoring draft
        if (draftText) {
          inputRef.current.selectionStart = draftText.length
          inputRef.current.selectionEnd = draftText.length
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refocus when exiting edit mode
  const prevEditingRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevEditingRef.current && !editDraft) {
      inputRef.current?.focus({ preventScroll: true })
    }
    prevEditingRef.current = editDraft?.id ?? null
  }, [editDraft])

  const handleSubmit = () => {
    const trimmed = draftText.trim()
    if (trimmed) {
      onSubmit(trimmed)
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

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onEditSave()
    }
    if (e.key === 'Escape') {
      onEditCancel()
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
                    onClick={() => onEditStart(c.id, c.body)}
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
              {editDraft?.id === c.id ? (
                <div className="comment-edit-area">
                  <textarea
                    value={editDraft.text}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={2}
                    ref={(el) => el?.focus({ preventScroll: true })}
                  />
                  <div className="comment-edit-actions">
                    <button onClick={onEditCancel} className="comment-edit-cancel">Cancel</button>
                    <button onClick={onEditSave} disabled={!editDraft.text.trim()} className="comment-submit">Save</button>
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
          value={draftText}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={3}
        />
        <div className="comment-actions">
          <span className="comment-hint">Cmd+Enter to submit</span>
          <button onClick={handleSubmit} disabled={!draftText.trim()} className="comment-submit">
            Comment
          </button>
        </div>
      </div>
    </div>
  )
}
