import { useState, useCallback, useEffect } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from './lib/markdown/comments'
import { ReviewMode } from './components/Editor/ReviewMode'
import { DocumentComments } from './components/Comments/DocumentComments'
import type { InlineComment, DocumentComment } from '../../shared/types'

export default function App() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [rawContent, setRawContent] = useState<string>('')
  const [cleanContent, setCleanContent] = useState<string>('')
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([])
  const [documentComments, setDocumentComments] = useState<DocumentComment[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  const loadFile = useCallback((path: string, content: string) => {
    setFilePath(path)
    setRawContent(content)
    setFileName(path.split('/').pop() || path)

    const parsed = parseComments(content)
    setCleanContent(parsed.content)
    setInlineComments(parsed.inlineComments)
    setDocumentComments(parsed.documentComments)
    setHasUnsavedChanges(false)
  }, [])

  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (result) {
      loadFile(result.filePath, result.content)
    }
  }, [loadFile])

  const handleSave = useCallback(async () => {
    if (!filePath) return

    const serialized = serializeComments(
      rawContent,
      inlineComments,
      documentComments,
      'reviewer'
    )

    await window.electronAPI.saveFile(filePath, serialized)
    setRawContent(serialized)
    setHasUnsavedChanges(false)
  }, [filePath, rawContent, inlineComments, documentComments])

  const handleAddInlineComment = useCallback((anchor: string, body: string) => {
    const comment = createInlineComment(anchor, body, 'reviewer')
    setInlineComments((prev) => [...prev, comment])
    setHasUnsavedChanges(true)
  }, [])

  const handleAddDocumentComment = useCallback((body: string) => {
    const comment = createDocumentComment(body, 'reviewer')
    setDocumentComments((prev) => [...prev, comment])
    setHasUnsavedChanges(true)
  }, [])

  const handleDeleteInlineComment = useCallback((id: string) => {
    setInlineComments((prev) => prev.filter((c) => c.id !== id))
    setHasUnsavedChanges(true)
  }, [])

  const handleDeleteDocumentComment = useCallback((id: string) => {
    setDocumentComments((prev) => prev.filter((c) => c.id !== id))
    setHasUnsavedChanges(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        handleOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, handleOpen])

  if (!filePath) {
    return (
      <div className="welcome">
        <div className="welcome-content">
          <h1>Markup</h1>
          <p>Review AI-generated plans and documents with inline comments.</p>
          <button onClick={handleOpen} className="open-button">
            Open Markdown File
          </button>
          <p className="shortcut-hint">or press <kbd>Cmd+O</kbd></p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="titlebar">
        <div className="titlebar-left">
          <button onClick={handleOpen} className="titlebar-button" title="Open file (Cmd+O)">
            Open
          </button>
        </div>
        <div className="titlebar-center">
          <span className="filename">
            {fileName}
            {hasUnsavedChanges && <span className="unsaved-dot" title="Unsaved changes" />}
          </span>
        </div>
        <div className="titlebar-right">
          <button
            onClick={handleSave}
            className="titlebar-button save-button"
            disabled={!hasUnsavedChanges}
            title="Save (Cmd+S)"
          >
            Save
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-pane">
          <ReviewMode
            content={cleanContent}
            inlineComments={inlineComments}
            onAddComment={handleAddInlineComment}
            onDeleteComment={handleDeleteInlineComment}
          />
        </div>
        <div className="comments-panel">
          <DocumentComments
            comments={documentComments}
            onAdd={handleAddDocumentComment}
            onDelete={handleDeleteDocumentComment}
          />
        </div>
      </div>
    </div>
  )
}
