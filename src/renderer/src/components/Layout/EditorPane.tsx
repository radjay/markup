import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ReviewMode } from '../Editor/ReviewMode'
import { EditMode } from '../Editor/EditMode'
import type { Tab } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  activeTab: Tab | null
  doc: ActiveDocumentState
}

export interface EditorPaneHandle {
  getScrollTop: () => number
}

export const EditorPane = forwardRef<EditorPaneHandle, Props>(function EditorPane(
  { activeTab, doc },
  ref
) {
  const paneRef = useRef<HTMLDivElement>(null)
  const lastFileRef = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    getScrollTop: () => paneRef.current?.scrollTop ?? 0
  }))

  // Restore scroll position when switching to a tab
  useEffect(() => {
    if (!activeTab || !paneRef.current) return
    if (lastFileRef.current !== activeTab.filePath) {
      paneRef.current.scrollTop = activeTab.scrollTop
      lastFileRef.current = activeTab.filePath
    }
  }, [activeTab?.filePath, activeTab?.scrollTop])

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
})
