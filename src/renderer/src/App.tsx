import { useState, useCallback, useEffect, useMemo } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from './lib/markdown/comments'
import { ReviewMode } from './components/Editor/ReviewMode'
import { EditMode } from './components/Editor/EditMode'
import { DocumentComments } from './components/Comments/DocumentComments'
import { FileTree } from './components/Sidebar/FileTree'
import { Outline } from './components/Sidebar/Outline'
import type { InlineComment, DocumentComment, FileEntry, HeadingEntry } from '../../shared/types'

type EditorMode = 'review' | 'edit'

export default function App() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [rawContent, setRawContent] = useState<string>('')
  const [cleanContent, setCleanContent] = useState<string>('')
  const [editContent, setEditContent] = useState<string>('')
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([])
  const [documentComments, setDocumentComments] = useState<DocumentComment[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [mode, setMode] = useState<EditorMode>('review')
  const [directoryPath, setDirectoryPath] = useState<string | null>(null)
  const [directoryFiles, setDirectoryFiles] = useState<FileEntry[]>([])
  const [showExternalChangeBar, setShowExternalChangeBar] = useState(false)

  // Extract headings from clean content for the outline
  const headings = useMemo<HeadingEntry[]>(() => {
    if (!cleanContent) return []
    const result: HeadingEntry[] = []
    const lines = cleanContent.split('\n')
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const text = match[2].trim()
        result.push({
          level: match[1].length,
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        })
      }
    }
    return result
  }, [cleanContent])

  const loadFile = useCallback((path: string, content: string) => {
    setFilePath(path)
    setRawContent(content)
    setFileName(path.split('/').pop() || path)
    setShowExternalChangeBar(false)

    try {
      const parsed = parseComments(content)
      setCleanContent(parsed.content)
      setEditContent(parsed.content)
      setInlineComments(parsed.inlineComments)
      setDocumentComments(parsed.documentComments)
    } catch (err) {
      console.error('Failed to parse markdown:', err)
      setCleanContent(content)
      setEditContent(content)
    }
    setHasUnsavedChanges(false)

    // Set directory context from file path (if no directory already open)
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir) {
      setDirectoryPath((prev) => {
        const target = prev || dir
        window.electronAPI.listDirectory(target).then(setDirectoryFiles)
        return target
      })
    }

    // Watch for external changes
    window.electronAPI.watchFile(path)
  }, [])

  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (result) {
      loadFile(result.filePath, result.content)
    }
  }, [loadFile])

  const handleOpenDirectory = useCallback(async () => {
    const dir = await window.electronAPI.openDirectory()
    if (dir) {
      setDirectoryPath(dir)
      const files = await window.electronAPI.listDirectory(dir)
      setDirectoryFiles(files)
    }
  }, [])

  const handleSelectFile = useCallback(
    async (path: string) => {
      // Unwatch previous file
      if (filePath) window.electronAPI.unwatchFile(filePath)

      const result = await window.electronAPI.readFile(path)
      loadFile(result.filePath, result.content)
      setMode('review')
    },
    [filePath, loadFile]
  )

  const handleSave = useCallback(async () => {
    if (!filePath) return

    try {
      // If in edit mode, use the edited content as the new raw content
      const baseContent = mode === 'edit' ? editContent : rawContent
      const serialized = serializeComments(baseContent, inlineComments, documentComments)
      await window.electronAPI.saveFile(filePath, serialized)
      setRawContent(serialized)

      // Re-parse to update clean content
      const parsed = parseComments(serialized)
      setCleanContent(parsed.content)
      setEditContent(parsed.content)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('[Markup] Save failed:', err)
    }
  }, [filePath, rawContent, editContent, mode, inlineComments, documentComments])

  const handleModeToggle = useCallback(() => {
    if (mode === 'edit') {
      // Switching from edit to review — apply edit changes
      setCleanContent(editContent)
      setRawContent(editContent)
      if (editContent !== cleanContent) {
        setHasUnsavedChanges(true)
      }
    } else {
      // Switching from review to edit
      setEditContent(cleanContent)
    }
    setMode((prev) => (prev === 'review' ? 'edit' : 'review'))
  }, [mode, editContent, cleanContent])

  const handleEditChange = useCallback((content: string) => {
    setEditContent(content)
    setHasUnsavedChanges(true)
  }, [])

  const handleAddInlineComment = useCallback((anchor: string, body: string) => {
    const comment = createInlineComment(anchor, body, '')
    setInlineComments((prev) => [...prev, comment])
    setHasUnsavedChanges(true)
  }, [])

  const handleAddDocumentComment = useCallback((body: string) => {
    const comment = createDocumentComment(body, '')
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

  const handleReloadFile = useCallback(async () => {
    if (!filePath) return
    const result = await window.electronAPI.readFile(filePath)
    loadFile(result.filePath, result.content)
  }, [filePath, loadFile])

  const handleScrollToHeading = useCallback((id: string) => {
    // Find the heading element by scanning commentable blocks
    const headings = document.querySelectorAll('.review-mode h1, .review-mode h2, .review-mode h3')
    for (const el of headings) {
      const text = el.textContent || ''
      const elId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (elId === id) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }, [])

  // Listen for external file changes
  useEffect(() => {
    const cleanup = window.electronAPI.onFileChanged((changedPath: string) => {
      if (changedPath === filePath) {
        setShowExternalChangeBar(true)
      }
    })
    return cleanup
  }, [filePath])

  // Native menu events
  useEffect(() => {
    const cleanups = [
      window.electronAPI.onMenuOpenFile(() => handleOpen()),
      window.electronAPI.onMenuOpenDirectory(() => handleOpenDirectory()),
      window.electronAPI.onMenuSave(() => handleSave()),
      window.electronAPI.onMenuToggleMode(() => handleModeToggle())
    ]
    return () => cleanups.forEach((c) => c())
  }, [handleOpen, handleOpenDirectory, handleSave, handleModeToggle])

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const droppedPath = (files[0] as unknown as { path: string }).path
      if (!droppedPath) return

      const result = await window.electronAPI.handleDrop(droppedPath)
      if (!result) return

      if (result.type === 'file') {
        loadFile(result.filePath, result.content)
      } else if (result.type === 'directory') {
        setDirectoryPath(result.dirPath)
        const dirFiles = await window.electronAPI.listDirectory(result.dirPath)
        setDirectoryFiles(dirFiles)
      }
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [loadFile])

  if (!filePath && !directoryPath) {
    return (
      <div className="welcome">
        <div className="welcome-content">
          <svg className="welcome-icon" width="80" height="50" viewBox="0 0 208 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M193 5H15C9.47715 5 5 9.47715 5 15V113C5 118.523 9.47715 123 15 123H193C198.523 123 203 118.523 203 113V15C203 9.47715 198.523 5 193 5Z" stroke="currentColor" strokeWidth="10"/>
            <path d="M155 30L185 63H165V98H145V63H125L155 30Z" fill="currentColor"/>
            <path d="M30 98V30H50L70 55L90 30H110V98H90V59L70 84L50 59V98H30Z" fill="currentColor"/>
          </svg>
          <p>Review AI-generated plans and documents with inline comments.</p>
          <div className="welcome-buttons">
            <button onClick={handleOpen} className="open-button">
              Open File
            </button>
            <button onClick={handleOpenDirectory} className="open-button open-button-secondary">
              Open Folder
            </button>
          </div>
          <p className="shortcut-hint">
            <kbd>Cmd+O</kbd> open file
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="titlebar">
        <div className="titlebar-left" />
        <div className="titlebar-center">
          <span className="filename">
            {fileName}
            {hasUnsavedChanges && <span className="unsaved-dot" title="Unsaved changes" />}
          </span>
        </div>
        <div className="titlebar-right">
          {filePath && (
            <>
              <div className="mode-toggle">
                <button
                  className={`mode-button ${mode === 'review' ? 'active' : ''}`}
                  onClick={() => mode !== 'review' && handleModeToggle()}
                >
                  Review
                </button>
                <button
                  className={`mode-button ${mode === 'edit' ? 'active' : ''}`}
                  onClick={() => mode !== 'edit' && handleModeToggle()}
                >
                  Edit
                </button>
              </div>
              <button
                onClick={handleSave}
                className="titlebar-button save-button"
                disabled={!hasUnsavedChanges}
                title="Save (Cmd+S)"
              >
                Save
              </button>
            </>
          )}
        </div>
      </header>

      {showExternalChangeBar && (
        <div className="external-change-bar">
          <span>This file was modified externally.</span>
          <button onClick={handleReloadFile}>Reload</button>
          <button onClick={() => setShowExternalChangeBar(false)}>Dismiss</button>
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h4 className="sidebar-section-title">Files</h4>
              <button className="sidebar-action" onClick={handleOpenDirectory} title="Open folder">
                +
              </button>
            </div>
            <FileTree
              files={directoryFiles}
              currentFile={filePath}
              onSelectFile={handleSelectFile}
            />
          </div>
          <div className="sidebar-section">
            <Outline headings={headings} onClickHeading={handleScrollToHeading} />
          </div>
        </aside>

        <div className="editor-pane">
          {!filePath ? (
            <div className="editor-empty">
              <p>Select a file from the sidebar to start reviewing.</p>
            </div>
          ) : mode === 'review' ? (
            <ReviewMode
              content={cleanContent}
              inlineComments={inlineComments}
              onAddComment={handleAddInlineComment}
              onDeleteComment={handleDeleteInlineComment}
            />
          ) : (
            <EditMode content={cleanContent} onChange={handleEditChange} />
          )}
        </div>

        {filePath && (
          <div className="comments-panel">
            <DocumentComments
              comments={documentComments}
              onAdd={handleAddDocumentComment}
              onDelete={handleDeleteDocumentComment}
            />
          </div>
        )}
      </div>
    </div>
  )
}
