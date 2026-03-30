import { useState, useCallback, useMemo, useEffect } from 'react'
import { parseComments, serializeComments, createInlineComment, createDocumentComment } from '../lib/markdown/comments'
import type { HeadingEntry } from '../../../shared/types'
import type { TabManager } from './useTabs'

export interface ActiveDocumentState {
  headings: HeadingEntry[]
  showExternalChangeBar: boolean
  save: () => Promise<void>
  modeToggle: () => void
  editChange: (content: string) => void
  addInlineComment: (anchor: string, body: string) => void
  addDocumentComment: (body: string) => void
  deleteInlineComment: (id: string) => void
  deleteDocumentComment: (id: string) => void
  reloadFile: () => Promise<void>
  scrollToHeading: (id: string) => void
  dismissExternalChange: () => void
}

export function useActiveDocument(tabManager: TabManager): ActiveDocumentState {
  const { activeTab, updateActiveTab } = tabManager
  const [showExternalChangeBar, setShowExternalChangeBar] = useState(false)

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
    const els = document.querySelectorAll('.review-mode h1, .review-mode h2, .review-mode h3')
    for (const el of els) {
      const text = el.textContent || ''
      const elId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      if (elId === id) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); break }
    }
  }, [])

  const dismissExternalChange = useCallback(() => setShowExternalChangeBar(false), [])

  return {
    headings, showExternalChangeBar,
    save, modeToggle, editChange,
    addInlineComment, addDocumentComment, deleteInlineComment, deleteDocumentComment,
    reloadFile, scrollToHeading, dismissExternalChange
  }
}
