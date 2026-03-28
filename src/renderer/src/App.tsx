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

    try {
      const parsed = parseComments(content)
      setCleanContent(parsed.content)
      setInlineComments(parsed.inlineComments)
      setDocumentComments(parsed.documentComments)
    } catch (err) {
      console.error('Failed to parse markdown:', err)
      // Fallback: show raw content without comment parsing
      setCleanContent(content)
    }
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

    try {
      const serialized = serializeComments(
        rawContent,
        inlineComments,
        documentComments
      )
      console.log('[Markup] Saving to:', filePath, 'length:', serialized.length)
      const result = await window.electronAPI.saveFile(filePath, serialized)
      console.log('[Markup] Save result:', result)
      setRawContent(serialized)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('[Markup] Save failed:', err)
    }
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
          <svg className="welcome-icon" width="80" height="50" viewBox="0 0 208 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M193 5H15C9.47715 5 5 9.47715 5 15V113C5 118.523 9.47715 123 15 123H193C198.523 123 203 118.523 203 113V15C203 9.47715 198.523 5 193 5Z" stroke="currentColor" strokeWidth="10"/>
            <path d="M155 30L185 63H165V98H145V63H125L155 30Z" fill="currentColor"/>
            <path d="M30 98V30H50L70 55L90 30H110V98H90V59L70 84L50 59V98H30Z" fill="currentColor"/>
          </svg>
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
