import { useState, useCallback, useEffect, useMemo } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from './lib/markdown/comments'
import { ReviewMode } from './components/Editor/ReviewMode'
import { EditMode } from './components/Editor/EditMode'
import { DocumentComments } from './components/Comments/DocumentComments'
import { FileTree } from './components/Sidebar/FileTree'
import { RecentFiles } from './components/Sidebar/RecentFiles'
import { SidebarHeader } from './components/Sidebar/SidebarHeader'
import { Outline } from './components/Sidebar/Outline'
import type { InlineComment, DocumentComment, FileEntry, HeadingEntry, WatchedFile } from '../../shared/types'

type EditorMode = 'review' | 'edit'
type SidebarMode = 'tree' | 'recent'

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
  pinned: boolean
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
    filePath, fileName, rawContent: content, cleanContent, editContent: cleanContent,
    inlineComments, documentComments, hasUnsavedChanges: false, mode: 'review', pinned
  }
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('recent')
  const [folders, setFolders] = useState<string[]>([])
  const [folderFiles, setFolderFiles] = useState<Map<string, FileEntry[]>>(new Map())
  const [recentFiles, setRecentFiles] = useState<WatchedFile[]>([])
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set())
  const [showExternalChangeBar, setShowExternalChangeBar] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const activeTab = activeTabIndex >= 0 && activeTabIndex < tabs.length ? tabs[activeTabIndex] : null

  const updateTab = useCallback((index: number, updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }, [])

  const updateActiveTab = useCallback(
    (updates: Partial<Tab>) => {
      if (activeTabIndex >= 0) updateTab(activeTabIndex, updates)
    },
    [activeTabIndex, updateTab]
  )

  const headings = useMemo<HeadingEntry[]>(() => {
    if (!activeTab?.cleanContent) return []
    const result: HeadingEntry[] = []
    for (const line of activeTab.cleanContent.split('\n')) {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const text = match[2].trim()
        result.push({
          level: match[1].length, text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        })
      }
    }
    return result
  }, [activeTab?.cleanContent])

  // Load settings on startup
  useEffect(() => {
    (async () => {
      const settings = await window.electronAPI.loadSettings()
      setFolders(settings.folders)
      setSidebarMode(settings.sidebarMode)
      setSettingsLoaded(true)

      // Load file trees for all folders
      for (const folder of settings.folders) {
        const files = await window.electronAPI.listDirectory(folder)
        setFolderFiles((prev) => new Map(prev).set(folder, files))
      }

      // Load recent files
      if (settings.folders.length > 0) {
        const recent = await window.electronAPI.listRecentFiles()
        setRecentFiles(recent)
      }
    })()
  }, [])

  // Refresh recent files and folder trees when chokidar events fire
  useEffect(() => {
    const refreshAll = async () => {
      for (const folder of folders) {
        const files = await window.electronAPI.listDirectory(folder)
        setFolderFiles((prev) => new Map(prev).set(folder, files))
      }
      if (folders.length > 0) {
        const recent = await window.electronAPI.listRecentFiles()
        setRecentFiles(recent)
      }
    }

    const cleanups = [
      window.electronAPI.onFileAdded(() => refreshAll()),
      window.electronAPI.onFileRemoved(() => refreshAll()),
      window.electronAPI.onFileChanged((changedPath) => {
        refreshAll()
        if (activeTab && changedPath === activeTab.filePath) {
          setShowExternalChangeBar(true)
        }
      })
    ]
    return () => cleanups.forEach((c) => c())
  }, [folders, activeTab])

  const openFileInTab = useCallback(
    (filePath: string, content: string, pinned: boolean) => {
      const existingIndex = tabs.findIndex((t) => t.filePath === filePath)
      if (existingIndex >= 0) {
        setActiveTabIndex(existingIndex)
        if (pinned) updateTab(existingIndex, { pinned: true })
        // Mark as viewed
        setViewedFiles((prev) => new Set(prev).add(filePath))
        return
      }

      const newTab = parseFileIntoTab(filePath, content, pinned)

      if (!pinned) {
        const previewIndex = tabs.findIndex((t) => !t.pinned)
        if (previewIndex >= 0) {
          window.electronAPI.unwatchFile(tabs[previewIndex].filePath)
          setTabs((prev) => prev.map((t, i) => (i === previewIndex ? newTab : t)))
          setActiveTabIndex(previewIndex)
          window.electronAPI.watchFile(filePath)
          setViewedFiles((prev) => new Set(prev).add(filePath))
          return
        }
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabIndex(tabs.length)
      window.electronAPI.watchFile(filePath)
      setViewedFiles((prev) => new Set(prev).add(filePath))
    },
    [tabs, updateTab]
  )

  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (result) {
      openFileInTab(result.filePath, result.content, true)
    }
  }, [openFileInTab])

  const handleAddFolder = useCallback(async () => {
    const folder = await window.electronAPI.addFolder()
    if (folder) {
      setFolders((prev) => prev.includes(folder) ? prev : [...prev, folder])
      const files = await window.electronAPI.listDirectory(folder)
      setFolderFiles((prev) => new Map(prev).set(folder, files))
      const recent = await window.electronAPI.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [])

  const handleRemoveFolder = useCallback(async (folder: string) => {
    await window.electronAPI.removeFolder(folder)
    setFolders((prev) => prev.filter((f) => f !== folder))
    setFolderFiles((prev) => {
      const next = new Map(prev)
      next.delete(folder)
      return next
    })
    const recent = await window.electronAPI.listRecentFiles()
    setRecentFiles(recent)
  }, [])

  const handleSelectFile = useCallback(
    async (path: string) => {
      const result = await window.electronAPI.readFile(path)
      openFileInTab(result.filePath, result.content, false)
    },
    [openFileInTab]
  )

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
        if (tabs.length <= 1) setActiveTabIndex(-1)
        else if (index >= tabs.length - 1) setActiveTabIndex(index - 1)
        else setActiveTabIndex(index)
      } else if (index < activeTabIndex) {
        setActiveTabIndex((prev) => prev - 1)
      }
    },
    [tabs, activeTabIndex]
  )

  const handleTabClick = useCallback(
    (index: number) => {
      setActiveTabIndex(index)
      if (!tabs[index].pinned) updateTab(index, { pinned: true })
    },
    [tabs, updateTab]
  )

  const handleSave = useCallback(async () => {
    if (!activeTab) return
    try {
      const baseContent = activeTab.mode === 'edit' ? activeTab.editContent : activeTab.rawContent
      const serialized = serializeComments(baseContent, activeTab.inlineComments, activeTab.documentComments)
      await window.electronAPI.saveFile(activeTab.filePath, serialized)
      const parsed = parseComments(serialized)
      updateActiveTab({
        rawContent: serialized, cleanContent: parsed.content, editContent: parsed.content,
        hasUnsavedChanges: false, pinned: true
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
        mode: 'review', cleanContent: activeTab.editContent, rawContent: activeTab.editContent,
        hasUnsavedChanges: activeTab.hasUnsavedChanges || changed
      })
    } else {
      updateActiveTab({ mode: 'edit', editContent: activeTab.cleanContent })
    }
  }, [activeTab, updateActiveTab])

  const handleEditChange = useCallback(
    (content: string) => { updateActiveTab({ editContent: content, hasUnsavedChanges: true, pinned: true }) },
    [updateActiveTab]
  )

  const handleAddInlineComment = useCallback(
    (anchor: string, body: string) => {
      if (!activeTab) return
      updateActiveTab({
        inlineComments: [...activeTab.inlineComments, createInlineComment(anchor, body, '')],
        hasUnsavedChanges: true, pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleAddDocumentComment = useCallback(
    (body: string) => {
      if (!activeTab) return
      updateActiveTab({
        documentComments: [...activeTab.documentComments, createDocumentComment(body, '')],
        hasUnsavedChanges: true, pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const handleDeleteInlineComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({ inlineComments: activeTab.inlineComments.filter((c) => c.id !== id), hasUnsavedChanges: true })
    },
    [activeTab, updateActiveTab]
  )

  const handleDeleteDocumentComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({ documentComments: activeTab.documentComments.filter((c) => c.id !== id), hasUnsavedChanges: true })
    },
    [activeTab, updateActiveTab]
  )

  const handleReloadFile = useCallback(async () => {
    if (!activeTab) return
    const result = await window.electronAPI.readFile(activeTab.filePath)
    const parsed = parseComments(result.content)
    updateActiveTab({
      rawContent: result.content, cleanContent: parsed.content, editContent: parsed.content,
      inlineComments: parsed.inlineComments, documentComments: parsed.documentComments, hasUnsavedChanges: false
    })
    setShowExternalChangeBar(false)
  }, [activeTab, updateActiveTab])

  const handleScrollToHeading = useCallback((id: string) => {
    const els = document.querySelectorAll('.review-mode h1, .review-mode h2, .review-mode h3')
    for (const el of els) {
      const text = el.textContent || ''
      const elId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (elId === id) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); break }
    }
  }, [])

  const handleSidebarModeChange = useCallback(async (mode: SidebarMode) => {
    setSidebarMode(mode)
    await window.electronAPI.saveSettings({ folders, sidebarMode: mode })
    if (mode === 'recent') {
      const recent = await window.electronAPI.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [folders])

  // Menu events
  useEffect(() => {
    const cleanups = [
      window.electronAPI.onMenuOpenFile(() => handleOpen()),
      window.electronAPI.onMenuAddFolder(() => handleAddFolder()),
      window.electronAPI.onMenuSave(() => handleSave()),
      window.electronAPI.onMenuToggleMode(() => handleModeToggle())
    ]
    return () => cleanups.forEach((c) => c())
  }, [handleOpen, handleAddFolder, handleSave, handleModeToggle])

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      const droppedPath = (files[0] as unknown as { path: string }).path
      if (!droppedPath) return
      const result = await window.electronAPI.handleDrop(droppedPath)
      if (!result) return
      if (result.type === 'file') {
        openFileInTab(result.filePath, result.content, true)
      } else if (result.type === 'directory') {
        // Treat dropped folder as "Add Folder"
        const folder = result.dirPath
        await window.electronAPI.removeFolder(folder) // no-op if not exists
        const added = folder // We need to add it via settings
        setFolders((prev) => prev.includes(added) ? prev : [...prev, added])
        await window.electronAPI.saveSettings({ folders: [...folders, added], sidebarMode })
        const dirFiles = await window.electronAPI.listDirectory(added)
        setFolderFiles((prev) => new Map(prev).set(added, dirFiles))
      }
    }
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => { document.removeEventListener('dragover', handleDragOver); document.removeEventListener('drop', handleDrop) }
  }, [openFileInTab, folders, sidebarMode])

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

  if (!settingsLoaded) return null

  if (tabs.length === 0 && folders.length === 0) {
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
            <button onClick={handleOpen} className="open-button">Open File</button>
            <button onClick={handleAddFolder} className="open-button open-button-secondary">Add Folder</button>
          </div>
          <p className="shortcut-hint">or drag a file or folder here</p>
        </div>
      </div>
    )
  }

  const folderEntries = folders.map((f) => ({ path: f, files: folderFiles.get(f) || [] }))

  return (
    <div className="app">
      <div className="titlebar-drag" />

      <div className="main-content">
        <aside className="sidebar">
          <SidebarHeader
            mode={sidebarMode}
            onModeChange={handleSidebarModeChange}
            onAddFolder={handleAddFolder}
          />
          <div className="sidebar-content">
            {sidebarMode === 'tree' ? (
              <FileTree
                folders={folderEntries}
                currentFile={activeTab?.filePath || null}
                onSelectFile={handleSelectFile}
                onDoubleClickFile={handlePinFile}
                onRemoveFolder={handleRemoveFolder}
              />
            ) : (
              <RecentFiles
                files={recentFiles}
                currentFile={activeTab?.filePath || null}
                viewedFiles={viewedFiles}
                onSelectFile={handleSelectFile}
                onDoubleClickFile={handlePinFile}
              />
            )}
          </div>
        </aside>

        <div className="editor-area">
          {tabs.length > 0 && (
            <div className="tab-bar">
              <div className="tab-list">
                {tabs.map((tab, i) => (
                  <div
                    key={tab.filePath}
                    className={`tab ${i === activeTabIndex ? 'active' : ''} ${!tab.pinned ? 'preview' : ''}`}
                    onClick={() => handleTabClick(i)}
                  >
                    <span className="tab-name">{tab.fileName}</span>
                    {tab.hasUnsavedChanges ? (
                      <span className="unsaved-dot" />
                    ) : (
                      <button className="tab-close" onClick={(e) => { e.stopPropagation(); handleCloseTab(i) }}>&times;</button>
                    )}
                  </div>
                ))}
              </div>
              {activeTab && (
                <div className="tab-bar-right">
                  <div className="mode-toggle">
                    <button className={`mode-button ${activeTab.mode === 'review' ? 'active' : ''}`} onClick={() => activeTab.mode !== 'review' && handleModeToggle()}>Review</button>
                    <button className={`mode-button ${activeTab.mode === 'edit' ? 'active' : ''}`} onClick={() => activeTab.mode !== 'edit' && handleModeToggle()}>Edit</button>
                  </div>
                  <button onClick={handleSave} className="titlebar-button save-button" disabled={!activeTab.hasUnsavedChanges} title="Save (Cmd+S)">Save</button>
                </div>
              )}
            </div>
          )}

          {showExternalChangeBar && (
            <div className="external-change-bar">
              <span>This file was modified externally.</span>
              <button onClick={handleReloadFile}>Reload</button>
              <button onClick={() => setShowExternalChangeBar(false)}>Dismiss</button>
            </div>
          )}

          <div className="editor-pane">
            {!activeTab ? (
              <div className="editor-empty"><p>Select a file from the sidebar to start reviewing.</p></div>
            ) : activeTab.mode === 'review' ? (
              <ReviewMode key={activeTab.filePath} content={activeTab.cleanContent} inlineComments={activeTab.inlineComments} onAddComment={handleAddInlineComment} onDeleteComment={handleDeleteInlineComment} />
            ) : (
              <EditMode key={activeTab.filePath} content={activeTab.cleanContent} onChange={handleEditChange} />
            )}
          </div>
        </div>

        {activeTab && (
          <div className="comments-panel">
            <DocumentComments comments={activeTab.documentComments} onAdd={handleAddDocumentComment} onDelete={handleDeleteDocumentComment} />
            <Outline headings={headings} onClickHeading={handleScrollToHeading} />
          </div>
        )}
      </div>
    </div>
  )
}
