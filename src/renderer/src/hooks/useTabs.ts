import { useState, useCallback } from 'react'
import { parseComments } from '../lib/markdown/comments'
import type { InlineComment, DocumentComment } from '../../../shared/types'
import { useFileService } from '../../../lib/platform/FileServiceContext'

export type EditorMode = 'review' | 'edit'

export interface Tab {
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
  scrollTop: number
  sha?: string
}

function parseFileIntoTab(filePath: string, content: string, pinned: boolean, defaultMode: EditorMode = 'review', sha?: string): Tab {
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
    inlineComments, documentComments, hasUnsavedChanges: false, mode: defaultMode, pinned, scrollTop: 0, sha
  }
}

export interface TabManager {
  tabs: Tab[]
  activeTabIndex: number
  activeTab: Tab | null
  openFileInTab: (filePath: string, content: string, pinned: boolean, sha?: string) => void
  closeTab: (index: number) => void
  clickTab: (index: number) => void
  updateTab: (index: number, updates: Partial<Tab>) => void
  updateActiveTab: (updates: Partial<Tab>) => void
}

export function useTabs(onFileViewed?: (filePath: string) => void, defaultMode: EditorMode = 'review'): TabManager {
  const fileService = useFileService()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1)

  const activeTab = activeTabIndex >= 0 && activeTabIndex < tabs.length ? tabs[activeTabIndex] : null

  const updateTab = useCallback((index: number, updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }, [])

  const updateActiveTab = useCallback(
    (updates: Partial<Tab>) => {
      setTabs((prev) => {
        // Use the latest activeTabIndex from closure
        return prev.map((t, i) => {
          // We need to check current activeTabIndex
          return i === activeTabIndex ? { ...t, ...updates } : t
        })
      })
    },
    [activeTabIndex]
  )

  const confirmDiscardChanges = useCallback(
    (tab: Tab | null): boolean => {
      if (!tab || !tab.hasUnsavedChanges) return true
      return window.confirm(`"${tab.fileName}" has unsaved changes. Discard them?`)
    },
    []
  )

  const openFileInTab = useCallback(
    (filePath: string, content: string, pinned: boolean, sha?: string) => {
      const existingIndex = tabs.findIndex((t) => t.filePath === filePath)
      if (existingIndex >= 0) {
        setActiveTabIndex(existingIndex)
        if (pinned) updateTab(existingIndex, { pinned: true })
        onFileViewed?.(filePath)
        return
      }

      const newTab = parseFileIntoTab(filePath, content, pinned, defaultMode, sha)

      if (!pinned) {
        const previewIndex = tabs.findIndex((t) => !t.pinned)
        if (previewIndex >= 0) {
          if (!confirmDiscardChanges(tabs[previewIndex])) return
          fileService.unwatchFile(tabs[previewIndex].filePath)
          setTabs((prev) => prev.map((t, i) => (i === previewIndex ? newTab : t)))
          setActiveTabIndex(previewIndex)
          fileService.watchFile(filePath)
          onFileViewed?.(filePath)
          return
        }
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabIndex(tabs.length)
      fileService.watchFile(filePath)
      onFileViewed?.(filePath)
    },
    [tabs, updateTab, onFileViewed, confirmDiscardChanges, defaultMode, fileService]
  )

  const closeTab = useCallback(
    (index: number) => {
      const tab = tabs[index]
      if (!confirmDiscardChanges(tab)) return
      fileService.unwatchFile(tab.filePath)
      setTabs((prev) => prev.filter((_, i) => i !== index))
      if (index === activeTabIndex) {
        if (tabs.length <= 1) setActiveTabIndex(-1)
        else if (index >= tabs.length - 1) setActiveTabIndex(index - 1)
        else setActiveTabIndex(index)
      } else if (index < activeTabIndex) {
        setActiveTabIndex((prev) => prev - 1)
      }
    },
    [tabs, activeTabIndex, confirmDiscardChanges, fileService]
  )

  const clickTab = useCallback(
    (index: number) => {
      setActiveTabIndex(index)
      if (!tabs[index].pinned) updateTab(index, { pinned: true })
    },
    [tabs, updateTab]
  )

  return {
    tabs, activeTabIndex, activeTab,
    openFileInTab, closeTab, clickTab, updateTab, updateActiveTab
  }
}
