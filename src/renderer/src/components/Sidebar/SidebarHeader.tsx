import { FolderPlus } from 'lucide-react'
import { SegmentedToggle } from '../ui/SegmentedToggle'

interface Props {
  mode: 'tree' | 'recent'
  onModeChange: (mode: 'tree' | 'recent') => void
  onAddFolder: () => void
}

const modeOptions = [
  { value: 'tree', label: 'Files' },
  { value: 'recent', label: 'Recent' }
]

export function SidebarHeader({ mode, onModeChange, onAddFolder }: Props) {
  return (
    <div className="sidebar-header-bar">
      <SegmentedToggle
        options={modeOptions}
        value={mode}
        onChange={(v) => onModeChange(v as 'tree' | 'recent')}
        size="sm"
      />
      <button className="sidebar-action" onClick={onAddFolder} title="Add folder">
        <FolderPlus size={16} />
      </button>
    </div>
  )
}
