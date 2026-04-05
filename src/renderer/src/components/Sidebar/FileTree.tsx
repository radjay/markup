import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText } from 'lucide-react'
import type { FileEntry } from '../../../../shared/types'

interface Props {
  folders: { path: string; files: FileEntry[]; displayName?: string }[]
  gitInfo?: Map<string, { name: string; branch: string }>
  currentFile: string | null
  onSelectFile: (workspaceId: string, path: string) => void
  onDoubleClickFile?: (workspaceId: string, path: string) => void
  onRemoveFolder?: (path: string) => void
}

function FileNode({
  entry,
  currentFile,
  onSelectFile,
  onDoubleClickFile,
  depth
}: {
  entry: FileEntry
  currentFile: string | null
  onSelectFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)

  if (entry.isDirectory) {
    return (
      <div className="file-node">
        <div
          className="file-node-row directory"
          style={{ paddingLeft: `${12 + depth * 12}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="file-chevron">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          <span className="file-name">{entry.name}</span>
        </div>
        {expanded && entry.children && (
          <div className="file-children">
            {entry.children.map((child) => (
              <FileNode
                key={child.path}
                entry={child}
                currentFile={currentFile}
                onSelectFile={onSelectFile}
                onDoubleClickFile={onDoubleClickFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isActive = entry.path === currentFile

  return (
    <div className="file-node">
      <div
        className={`file-node-row file ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        title={entry.path}
        onClick={() => onSelectFile(entry.path)}
        onDoubleClick={() => onDoubleClickFile?.(entry.path)}
      >
        <span className="file-icon"><FileText size={14} /></span>
        <span className="file-name">{entry.name}</span>
      </div>
    </div>
  )
}

function FolderRoot({
  folderPath,
  displayName,
  files,
  branch,
  currentFile,
  onSelectFile,
  onDoubleClickFile,
  onRemoveFolder
}: {
  folderPath: string
  displayName?: string
  files: FileEntry[]
  branch?: string
  currentFile: string | null
  onSelectFile: (workspaceId: string, path: string) => void
  onDoubleClickFile?: (workspaceId: string, path: string) => void
  onRemoveFolder?: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  // Use explicit displayName if provided (GitHub repos), fall back to last two path segments
  const label = displayName ?? folderPath.split('/').slice(-2).join('/')

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Remove "${label}" from workspace?`)) {
      onRemoveFolder?.(folderPath)
    }
  }

  return (
    <div className="folder-root">
      <div className="folder-root-row" onClick={() => setExpanded(!expanded)}>
        <span className="file-chevron">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        <span className="folder-root-name">
          {label}
          {branch && <span className="folder-branch">{branch}</span>}
        </span>
        <button className="folder-remove" onClick={handleRemove} title="Remove folder">
          &times;
        </button>
      </div>
      {expanded && (
        <div className="folder-root-children">
          {files.map((entry) => (
            <FileNode
              key={entry.path}
              entry={entry}
              currentFile={currentFile}
              onSelectFile={(path) => onSelectFile(folderPath, path)}
              onDoubleClickFile={(path) => onDoubleClickFile?.(folderPath, path)}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ folders, gitInfo, currentFile, onSelectFile, onDoubleClickFile, onRemoveFolder }: Props) {
  if (folders.length === 0) {
    return <p className="sidebar-empty">No folders added yet.</p>
  }

  return (
    <div className="file-tree">
      {folders.map(({ path, files, displayName }) => (
        <FolderRoot
          key={path}
          folderPath={path}
          displayName={displayName}
          files={files}
          branch={gitInfo?.get(path)?.branch}
          currentFile={currentFile}
          onSelectFile={onSelectFile}
          onDoubleClickFile={onDoubleClickFile}
          onRemoveFolder={onRemoveFolder}
        />
      ))}
    </div>
  )
}
