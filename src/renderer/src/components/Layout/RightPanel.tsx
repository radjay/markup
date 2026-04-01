import { DocumentComments } from '../Comments/DocumentComments'
import { Outline } from '../Sidebar/Outline'
import type { Tab } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  activeTab: Tab
  doc: ActiveDocumentState
}

export function RightPanel({ activeTab, doc }: Props) {
  return (
    <div className="comments-panel">
      <DocumentComments
        comments={activeTab.documentComments}
        onAdd={doc.addDocumentComment}
        onEdit={doc.editDocumentComment}
        onDelete={doc.deleteDocumentComment}
      />
      <Outline headings={doc.headings} onClickHeading={doc.scrollToHeading} />
    </div>
  )
}
