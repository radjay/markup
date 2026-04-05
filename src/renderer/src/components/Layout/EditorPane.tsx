import { useRef, useEffect, useState } from 'react'
import { ReviewMode } from '../Editor/ReviewMode'
import { EditMode } from '../Editor/EditMode'
import { IOSPullToRefresh } from './IOSPullToRefresh'
import type { Tab } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  activeTab: Tab | null
  doc: ActiveDocumentState
  onScrollChange?: (scrollTop: number) => void
}

const isIOS = import.meta.env.MODE === 'ios'

export function EditorPane({ activeTab, doc, onScrollChange }: Props) {
  const paneRef = useRef<HTMLDivElement>(null)
  const lastFileRef = useRef<string | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // iOS keyboard: track how much viewport has shrunk so we can shrink the editor
  const [keyboardOffset, setKeyboardOffset] = useState(0)

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

  // iOS: shrink editor when virtual keyboard appears
  // visualViewport.height shrinks when the keyboard is shown; we compute the
  // difference from window.innerHeight and apply it as a bottom offset.
  useEffect(() => {
    if (!isIOS || typeof window === 'undefined' || !window.visualViewport) return

    const handleResize = () => {
      const vvHeight = window.visualViewport!.height
      const diff = window.innerHeight - vvHeight
      // Only apply offset when the keyboard is meaningfully open (>100px)
      setKeyboardOffset(diff > 100 ? diff : 0)
    }

    window.visualViewport!.addEventListener('resize', handleResize)
    return () => window.visualViewport!.removeEventListener('resize', handleResize)
  }, [])

  if (!activeTab) {
    return (
      <div className="editor-pane">
        <div className="editor-empty">
          <p>Select a file from the sidebar to start reviewing.</p>
        </div>
      </div>
    )
  }

  const editorContent = (
    <div
      className="editor-pane"
      ref={paneRef}
      style={keyboardOffset > 0 ? { paddingBottom: keyboardOffset } : undefined}
    >
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

  if (isIOS) {
    return (
      <IOSPullToRefresh onRefresh={doc.reloadFile}>
        {editorContent}
      </IOSPullToRefresh>
    )
  }

  return editorContent
}
