import { useRef, useEffect, useCallback } from 'react'
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

  // Restore scroll position when switching to a tab
  useEffect(() => {
    if (!activeTab || !paneRef.current) return
    if (lastFileRef.current !== activeTab.filePath) {
      paneRef.current.scrollTop = activeTab.scrollTop
      lastFileRef.current = activeTab.filePath
    }
  }, [activeTab])

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (paneRef.current && onScrollChange) {
      onScrollChange(paneRef.current.scrollTop)
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
    <div className="editor-pane" ref={paneRef} onScroll={handleScroll}>
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
