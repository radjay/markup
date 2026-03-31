import { useState, useCallback, useMemo, useEffect } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from '../lib/markdown/comments'
import type { HeadingEntry } from '../../../shared/types'
import type { TabManager } from './useTabs'

export interface ActiveDocumentState {
  headings: HeadingEntry[]
  showExternalChangeBar: boolean
  saveError: string | null
  dismissSaveError: () => void
  save: () => Promise<void>
  modeToggle: () => void
  editChange: (content: string) => void
  addInlineComment: (anchor: string, body: string) => void
  addDocumentComment: (body: string) => void
  editInlineComment: (id: string, body: string) => void
  editDocumentComment: (id: string, body: string) => void
  deleteInlineComment: (id: string) => void
  deleteDocumentComment: (id: string) => void
  reloadFile: () => Promise<void>
  scrollToHeading: (id: string) => void
  dismissExternalChange: () => void
}

export function useActiveDocument(tabManager: TabManager): ActiveDocumentState {
  const { activeTab, updateActiveTab } = tabManager
  const [showExternalChangeBar, setShowExternalChangeBar] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const headings = useMemo<HeadingEntry[]>(() => {
    if (!activeTab?.cleanContent) return []
    const result: HeadingEntry[] = []
    const idCounts = new Map<string, number>()
    for (const line of activeTab.cleanContent.split('\n')) {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const text = match[2].trim()
        const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const count = idCounts.get(baseId) || 0
        idCounts.set(baseId, count + 1)
        const id = count === 0 ? baseId : `${baseId}-${count}`
        result.push({ level: match[1].length, text, id })
      }
    }
    return result
  }, [activeTab?.cleanContent])

  // Listen for external file changes
  useEffect(() => {
    const cleanup = window.electronAPI.onFileChanged((changedPath: string) => {
      if (activeTab && changedPath === activeTab.filePath) {
        setShowExternalChangeBar(true)
      }
    })
    return cleanup
  }, [activeTab])

  const save = useCallback(async () => {
    if (!activeTab) return
    setSaveError(null)
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
      const msg = err instanceof Error ? err.message : 'Save failed'
      setSaveError(msg)
    }
  }, [activeTab, updateActiveTab])

  const modeToggle = useCallback(() => {
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

  const editChange = useCallback(
    (content: string) => { updateActiveTab({ editContent: content, hasUnsavedChanges: true, pinned: true }) },
    [updateActiveTab]
  )

  const addInlineComment = useCallback(
    (anchor: string, body: string) => {
      if (!activeTab) return
      updateActiveTab({
        inlineComments: [...activeTab.inlineComments, createInlineComment(anchor, body, '')],
        hasUnsavedChanges: true, pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const addDocumentComment = useCallback(
    (body: string) => {
      if (!activeTab) return
      updateActiveTab({
        documentComments: [...activeTab.documentComments, createDocumentComment(body, '')],
        hasUnsavedChanges: true, pinned: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const editInlineComment = useCallback(
    (id: string, body: string) => {
      if (!activeTab) return
      updateActiveTab({
        inlineComments: activeTab.inlineComments.map((c) => c.id === id ? { ...c, body } : c),
        hasUnsavedChanges: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const editDocumentComment = useCallback(
    (id: string, body: string) => {
      if (!activeTab) return
      updateActiveTab({
        documentComments: activeTab.documentComments.map((c) => c.id === id ? { ...c, body } : c),
        hasUnsavedChanges: true
      })
    },
    [activeTab, updateActiveTab]
  )

  const deleteInlineComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({ inlineComments: activeTab.inlineComments.filter((c) => c.id !== id), hasUnsavedChanges: true })
    },
    [activeTab, updateActiveTab]
  )

  const deleteDocumentComment = useCallback(
    (id: string) => {
      if (!activeTab) return
      updateActiveTab({ documentComments: activeTab.documentComments.filter((c) => c.id !== id), hasUnsavedChanges: true })
    },
    [activeTab, updateActiveTab]
  )

  const reloadFile = useCallback(async () => {
    if (!activeTab) return
    const result = await window.electronAPI.readFile(activeTab.filePath)
    const parsed = parseComments(result.content)
    updateActiveTab({
      rawContent: result.content, cleanContent: parsed.content, editContent: parsed.content,
      inlineComments: parsed.inlineComments, documentComments: parsed.documentComments, hasUnsavedChanges: false
    })
    setShowExternalChangeBar(false)
  }, [activeTab, updateActiveTab])

  const scrollToHeading = useCallback((id: string) => {
    if (activeTab?.mode === 'edit') {
      // In edit mode, find the heading line in markdown content and scroll CodeMirror
      const content = activeTab.editContent || activeTab.cleanContent
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#{1,3}\s+(.+)$/)
        if (match) {
          const lineId = match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          if (lineId === id) {
            const cmLine = document.querySelector(`.cm-editor .cm-line:nth-child(${i + 1})`)
            if (cmLine) {
              cmLine.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
              // Fallback: scroll editor pane by estimated line height
              const editorPane = document.querySelector('.editor-pane')
              if (editorPane) editorPane.scrollTop = i * 22
            }
            break
          }
        }
      }
    } else {
      // In review mode, find the rendered heading element (with duplicate disambiguation)
      const els = document.querySelectorAll('.review-mode h1, .review-mode h2, .review-mode h3')
      const elIdCounts = new Map<string, number>()
      for (const el of els) {
        const text = el.textContent || ''
        const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const count = elIdCounts.get(baseId) || 0
        elIdCounts.set(baseId, count + 1)
        const elId = count === 0 ? baseId : `${baseId}-${count}`
        if (elId === id) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); break }
      }
    }
  }, [activeTab])

  const dismissExternalChange = useCallback(() => setShowExternalChangeBar(false), [])
  const dismissSaveError = useCallback(() => setSaveError(null), [])

  return {
    headings, showExternalChangeBar, saveError, dismissSaveError,
    save, modeToggle, editChange,
    addInlineComment, addDocumentComment, editInlineComment, editDocumentComment, deleteInlineComment, deleteDocumentComment,
    reloadFile, scrollToHeading, dismissExternalChange
  }
}
