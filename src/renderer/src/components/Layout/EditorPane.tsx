import { ReviewMode } from '../Editor/ReviewMode'
import { EditMode } from '../Editor/EditMode'
import type { Tab } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  activeTab: Tab | null
  doc: ActiveDocumentState
}

export function EditorPane({ activeTab, doc }: Props) {
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
    <div className="editor-pane">
      {activeTab.mode === 'review' ? (
        <ReviewMode
          key={activeTab.filePath}
          content={activeTab.cleanContent}
          inlineComments={activeTab.inlineComments}
          onAddComment={doc.addInlineComment}
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
