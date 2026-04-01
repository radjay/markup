import { useRef, useEffect } from 'react'
import { ReviewMode } from '../Editor/ReviewMode'
import { EditMode } from '../Editor/EditMode'
import type { Tab } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  activeTab: Tab | null
  doc: ActiveDocumentState
  onScrollChange?: (scrollTop: number) => void
}

export function EditorPane({ activeTab, doc, onScrollChange }: Props) {
  const paneRef = useRef<HTMLDivElement>(null)
  const lastFileRef = useRef<string | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore scroll position when switching to a tab
  useEffect(() => {
    if (!activeTab || !paneRef.current) return
    if (lastFileRef.current !== activeTab.filePath) {
      paneRef.current.scrollTop = activeTab.scrollTop
      lastFileRef.current = activeTab.filePath
    }
  }, [activeTab?.filePath, activeTab?.scrollTop])

  // Save scroll position — debounced to avoid re-render storms
  useEffect(() => {
    const pane = paneRef.current
    if (!pane || !onScrollChange) return

    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        if (pane) onScrollChange(pane.scrollTop)
      }, 500)
    }

    pane.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      pane.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [onScrollChange])

  if (!activeTab) {
    return (
      <div className="editor-pane">
        <div className="editor-empty">
          <p>Select a file from the sidebar to start reviewing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-pane" ref={paneRef}>
      {activeTab.mode === 'review' ? (
        <ReviewMode
          key={activeTab.filePath}
          content={activeTab.cleanContent}
          inlineComments={activeTab.inlineComments}
          onAddComment={doc.addInlineComment}
          onEditComment={doc.editInlineComment}
          onDeleteComment={doc.deleteInlineComment}
        />
      ) : (
        <EditMode
          key={activeTab.filePath}
          content={activeTab.cleanContent}
          onChange={doc.editChange}
        />
      )}
    </div>
  )
}
