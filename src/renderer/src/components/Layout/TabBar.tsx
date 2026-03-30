import type { TabManager } from '../../hooks/useTabs'
import type { ActiveDocumentState } from '../../hooks/useActiveDocument'

interface Props {
  tabManager: TabManager
  doc: ActiveDocumentState
}

export function TabBar({ tabManager, doc }: Props) {
  const { tabs, activeTabIndex, activeTab, clickTab, closeTab } = tabManager

  if (tabs.length === 0) return null

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab, i) => (
          <div
            key={tab.filePath}
            className={`tab ${i === activeTabIndex ? 'active' : ''} ${!tab.pinned ? 'preview' : ''}`}
            onClick={() => clickTab(i)}
          >
            <span className="tab-name">{tab.fileName}</span>
            {tab.hasUnsavedChanges ? (
              <span className="unsaved-dot" />
            ) : (
              <button
                className="tab-close"
                onClick={(e) => { e.stopPropagation(); closeTab(i) }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      {activeTab && (
        <div className="tab-bar-right">
          <div className="mode-toggle">
            <button
              className={`mode-button ${activeTab.mode === 'review' ? 'active' : ''}`}
              onClick={() => activeTab.mode !== 'review' && doc.modeToggle()}
            >
              Review
            </button>
            <button
              className={`mode-button ${activeTab.mode === 'edit' ? 'active' : ''}`}
              onClick={() => activeTab.mode !== 'edit' && doc.modeToggle()}
            >
              Edit
            </button>
          </div>
          <button
            onClick={doc.save}
            className="titlebar-button save-button"
            disabled={!activeTab.hasUnsavedChanges}
            title="Save (Cmd+S)"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
