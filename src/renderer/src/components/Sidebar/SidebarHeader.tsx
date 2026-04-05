import { FolderPlus, GitBranch } from 'lucide-react'
import { SegmentedToggle } from '../ui/SegmentedToggle'

interface Props {
  mode: 'tree' | 'recent'
  onModeChange: (mode: 'tree' | 'recent') => void
  onAddFolder: () => void
  onAddRepo?: () => void  // iOS: add GitHub repo instead of local folder
}

const modeOptions = [
  { value: 'tree', label: 'Files' },
  { value: 'recent', label: 'Recent' }
]

const isIOS = import.meta.env.MODE === 'ios'

export function SidebarHeader({ mode, onModeChange, onAddFolder, onAddRepo }: Props) {
  const handleAdd = isIOS && onAddRepo ? onAddRepo : onAddFolder

  return (
    <div className="sidebar-header-bar">
      <SegmentedToggle
        options={modeOptions}
        value={mode}
        onChange={(v) => onModeChange(v as 'tree' | 'recent')}
        size="sm"
      />
      <button
        className="sidebar-action"
        onClick={handleAdd}
        title={isIOS ? 'Connect GitHub repo' : 'Add folder'}
      >
        {isIOS ? <GitBranch size={16} /> : <FolderPlus size={16} />}
      </button>
    </div>
  )
}
