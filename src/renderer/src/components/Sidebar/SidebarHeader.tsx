interface Props {
  mode: 'tree' | 'recent'
  onModeChange: (mode: 'tree' | 'recent') => void
  onAddFolder: () => void
}

export function SidebarHeader({ mode, onModeChange, onAddFolder }: Props) {
  return (
    <div className="sidebar-header-bar">
      <div className="sidebar-mode-toggle">
        <button
          className={`sidebar-mode-button ${mode === 'tree' ? 'active' : ''}`}
          onClick={() => onModeChange('tree')}
        >
          Tree
        </button>
        <button
          className={`sidebar-mode-button ${mode === 'recent' ? 'active' : ''}`}
          onClick={() => onModeChange('recent')}
        >
          Recent
        </button>
      </div>
      <button className="sidebar-action" onClick={onAddFolder} title="Add folder">
        +
      </button>
    </div>
  )
}
