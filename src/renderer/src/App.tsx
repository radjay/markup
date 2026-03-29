import { useState, useCallback, useEffect, useMemo } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from './lib/markdown/comments'
import { ReviewMode } from './components/Editor/ReviewMode'
import { EditMode } from './components/Editor/EditMode'
import { DocumentComments } from './components/Comments/DocumentComments'
import { FileTree } from './components/Sidebar/FileTree'
import { Outline } from './components/Sidebar/Outline'
import type { InlineComment, DocumentComment, FileEntry, HeadingEntry } from '../../shared/types'

type EditorMode = 'review' | 'edit'

interface Tab {
  filePath: string
  fileName: string
  rawContent: string
  cleanContent: string
  editContent: string
  inlineComments: InlineComment[]
  documentComments: DocumentComment[]
  hasUnsavedChanges: boolean
  mode: EditorMode
  pinned: boolean // false = preview tab (italic, replaced on next open)
}

function parseFileIntoTab(filePath: string, content: string, pinned: boolean): Tab {
  const fileName = filePath.split('/').pop() || filePath
  let cleanContent = content
  let inlineComments: InlineComment[] = []
  let documentComments: DocumentComment[] = []

  try {
    const parsed = parseComments(content)
    cleanContent = parsed.content
    inlineComments = parsed.inlineComments
    documentComments = parsed.documentComments
  } catch (err) {
    console.error('Failed to parse markdown:', err)
  }

  return {
    filePath,
    fileName,
    rawContent: content,
    cleanContent,
    editContent: cleanContent,
    inlineComments,
    documentComments,
    hasUnsavedChanges: false,
    mode: 'review',
    pinned
  }
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1)
  const [directoryPath, setDirectoryPath] = useState<string | null>(null)
  const [directoryFiles, setDirectoryFiles] = useState<FileEntry[]>([])
  const [showExternalChangeBar, setShowExternalChangeBar] = useState(false)

  const activeTab = activeTabIndex >= 0 && activeTabIndex < tabs.length ? tabs[activeTabIndex] : null

  // Update a specific tab's state
  const updateTab = useCallback((index: number, updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }, [])

  // Update the active tab's state
  const updateActiveTab = useCallback(
    (updates: Partial<Tab>) => {
      if (activeTabIndex >= 0) updateTab(activeTabIndex, updates)
    },
    [activeTabIndex, updateTab]
  )

  // Extract headings from active tab's content
  const headings = useMemo<HeadingEntry[]>(() => {
    if (!activeTab?.cleanContent) return []
    const result: HeadingEntry[] = []
    for (const line of activeTab.cleanContent.split('\n')) {
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
  }, [activeTab?.cleanContent])

  // Open a file into a tab
  const openFileInTab = useCallback(
    (filePath: string, content: string, pinned: boolean) => {
      // Check if already open
      const existingIndex = tabs.findIndex((t) => t.filePath === filePath)
      if (existingIndex >= 0) {
        setActiveTabIndex(existingIndex)
        if (pinned) updateTab(existingIndex, { pinned: true })
        return
      }

      const newTab = parseFileIntoTab(filePath, content, pinned)

      // If opening as preview, replace existing preview tab
      if (!pinned) {
        const previewIndex = tabs.findIndex((t) => !t.pinned)
        if (previewIndex >= 0) {
          // Unwatch old preview file
          window.electronAPI.unwatchFile(tabs[previewIndex].filePath)
          setTabs((prev) => prev.map((t, i) => (i === previewIndex ? newTab : t)))
          setActiveTabIndex(previewIndex)
          window.electronAPI.watchFile(filePath)
          return
        }
      }

      // Add new tab
      setTabs((prev) => [...prev, newTab])
      setActiveTabIndex(tabs.length)
      window.electronAPI.watchFile(filePath)

      // Set directory context
      const dir = filePath.substring(0, filePath.lastIndexOf('/'))
      if (dir) {
        setDirectoryPath((prev) => {
          const target = prev || dir
          window.electronAPI.listDirectory(target).then(setDirectoryFiles)
          return target
        })
      }
    },
    [tabs, updateTab]
  )

  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (result) {
      openFileInTab(result.filePath, result.content, true) // Cmd+O always pins
    }
  }, [openFileInTab])

  const handleOpenDirectory = useCallback(async () => {
    const dir = await window.electronAPI.openDirectory()
    if (dir) {
      setDirectoryPath(dir)
      const files = await window.electronAPI.listDirectory(dir)
      setDirectoryFiles(files)
    }
  }, [])

  // Single click from sidebar = preview (unpinned)
  const handleSelectFile = useCallback(
    async (path: string) => {
      const result = await window.electronAPI.readFile(path)
      openFileInTab(result.filePath, result.content, false)
    },
    [openFileInTab]
  )

  // Double click from sidebar = pinned
  const handlePinFile = useCallback(
    async (path: string) => {
      const existingIndex = tabs.findIndex((t) => t.filePath === path)
      if (existingIndex >= 0) {
        updateTab(existingIndex, { pinned: true })
        setActiveTabIndex(existingIndex)
        return
      }
      const result = await window.electronAPI.readFile(path)
      openFileInTab(result.filePath, result.content, true)
    },
    [tabs, updateTab, openFileInTab]
  )

  const handleCloseTab = useCallback(
    (index: number) => {
      const tab = tabs[index]
      window.electronAPI.unwatchFile(tab.filePath)

      setTabs((prev) => prev.filter((_, i) => i !== index))

      if (index === activeTabIndex) {
        // Activate adjacent tab
        if (tabs.length <= 1) {
          setActiveTabIndex(-1)
        } else if (index >= tabs.length - 1) {
          setActiveTabIndex(index - 1)
        } else {
          setActiveTabIndex(index)
        }
      } else if (index < activeTabIndex) {
        setActiveTabIndex((prev) => prev - 1)
      }
    },
    [tabs, activeTabIndex]
  )

  const handleTabClick = useCallback(
    (index: number) => {
      setActiveTabIndex(index)
      // Clicking a tab pins it
      if (!tabs[index].pinned) {
        updateTab(index, { pinned: true })
      }
    },
    [tabs, updateTab]
  )

  const handleSave = useCallback(async () => {
    if (!activeTab) return

    try {
      const baseContent = activeTab.mode === 'edit' ? activeTab.editContent : activeTab.rawContent
      const serialized = serializeComments(baseContent, activeTab.inlineComments, activeTab.documentComments)

      await window.electronAPI.unwatchFile(activeTab.filePath)
      await window.electronAPI.saveFile(activeTab.filePath, serialized)
      setTimeout(() => { window.electronAPI.watchFile(activeTab.filePath) }, 1500)

      const parsed = parseComments(serialized)
      updateActiveTab({
        rawContent: serialized,
        cleanContent: parsed.content,
        editContent: parsed.content,
        hasUnsavedChanges: false,
        pinned: true // saving always pins
      })
    } catch (err) {
      console.error('[Markup] Save failed:', err)
    }
  }, [activeTab, updateActiveTab])

  const handleModeToggle = useCallback(() => {
    if (!activeTab) return

    if (activeTab.mode === 'edit') {
      const changed = activeTab.editContent !== activeTab.cleanContent
      updateActiveTab({
        mode: 'review',
        cleanContent: activeTab.editContent,
        rawContent: activeTab.editContent,
        hasUnsavedChanges: activeTab.hasUnsavedChanges || changed
      })
    } else {
      updateActiveTab({ mode: 'edit', editContent: activeTab.cleanContent })
    }
  }, [activeTab, updateActiveTab])

  const handleEditChange = useCallback(
    (content: string) => {
      updateActiveTab({ editContent: content, hasUnsavedChanges: true, pinned: true })
    },
    [updateActiveTab]
  )

  const handleAddInlineComment = useCallback(
    (anchor: string, body: string) => {
      if (!activeTab) return
      const comment = createInlineComment(anchor, body, '')
      updateActiveTab({
        inlineComments: [...activeTab.inlineComments, comment],
        hasUnsavedChanges: true,
        pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleAddDocumentComment = useCallback(
    (body: string) => {
      if (!activeTab) return
      const comment = createDocumentComment(body, '')
      updateActiveTab({
        documentComments: [...activeTab.documentComments, comment],
        hasUnsavedChanges: true,
        pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleDeleteInlineComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({
        inlineComments: activeTab.inlineComments.filter((c) => c.id !== id),
        hasUnsavedChanges: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleDeleteDocumentComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({
        documentComments: activeTab.documentComments.filter((c) => c.id !== id),
        hasUnsavedChanges: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleReloadFile = useCallback(async () => {
    if (!activeTab) return
    const result = await window.electronAPI.readFile(activeTab.filePath)
    const parsed = parseComments(result.content)
    updateActiveTab({
      rawContent: result.content,
      cleanContent: parsed.content,
      editContent: parsed.content,
      inlineComments: parsed.inlineComments,
      documentComments: parsed.documentComments,
      hasUnsavedChanges: false
    })
    setShowExternalChangeBar(false)
  }, [activeTab, updateActiveTab])

  const handleScrollToHeading = useCallback((id: string) => {
    const els = document.querySelectorAll('.review-mode h1, .review-mode h2, .review-mode h3')
    for (const el of els) {
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
      if (activeTab && changedPath === activeTab.filePath) {
        setShowExternalChangeBar(true)
      }
    })
    return cleanup
  }, [activeTab])

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
        openFileInTab(result.filePath, result.content, true)
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
  }, [openFileInTab])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabIndex >= 0) handleCloseTab(activeTabIndex)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabIndex, handleCloseTab])

  if (tabs.length === 0 && !directoryPath) {
    return (
      <div className="welcome">
        <div className="welcome-content">
          <svg className="welcome-icon" width="40" height="25" viewBox="0 0 208 128" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <p className="shortcut-hint">or drag a file or folder here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="titlebar">
        <div className="titlebar-left" />
        <div className="titlebar-center">
          <div className="tab-bar">
            {tabs.map((tab, i) => (
              <div
                key={tab.filePath}
                className={`tab ${i === activeTabIndex ? 'active' : ''} ${!tab.pinned ? 'preview' : ''}`}
                onClick={() => handleTabClick(i)}
              >
                <span className="tab-name">
                  {tab.fileName}
                  {tab.hasUnsavedChanges && <span className="unsaved-dot" />}
                </span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(i)
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="titlebar-right">
          {activeTab && (
            <>
              <div className="mode-toggle">
                <button
                  className={`mode-button ${activeTab.mode === 'review' ? 'active' : ''}`}
                  onClick={() => activeTab.mode !== 'review' && handleModeToggle()}
                >
                  Review
                </button>
                <button
                  className={`mode-button ${activeTab.mode === 'edit' ? 'active' : ''}`}
                  onClick={() => activeTab.mode !== 'edit' && handleModeToggle()}
                >
                  Edit
                </button>
              </div>
              <button
                onClick={handleSave}
                className="titlebar-button save-button"
                disabled={!activeTab.hasUnsavedChanges}
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
              currentFile={activeTab?.filePath || null}
              onSelectFile={handleSelectFile}
              onDoubleClickFile={handlePinFile}
            />
          </div>
          <div className="sidebar-section">
            <Outline headings={headings} onClickHeading={handleScrollToHeading} />
          </div>
        </aside>

        <div className="editor-pane">
          {!activeTab ? (
            <div className="editor-empty">
              <p>Select a file from the sidebar to start reviewing.</p>
            </div>
          ) : activeTab.mode === 'review' ? (
            <ReviewMode
              key={activeTab.filePath}
              content={activeTab.cleanContent}
              inlineComments={activeTab.inlineComments}
              onAddComment={handleAddInlineComment}
              onDeleteComment={handleDeleteInlineComment}
            />
          ) : (
            <EditMode
              key={activeTab.filePath}
              content={activeTab.cleanContent}
              onChange={handleEditChange}
            />
          )}
        </div>

        {activeTab && (
          <div className="comments-panel">
            <DocumentComments
              comments={activeTab.documentComments}
              onAdd={handleAddDocumentComment}
              onDelete={handleDeleteDocumentComment}
            />
          </div>
        )}
      </div>
    </div>
  )
}
