import { useState } from 'react'
import type { FileEntry } from '../../../../shared/types'

interface Props {
  folders: { path: string; files: FileEntry[] }[]
  currentFile: string | null
  onSelectFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
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
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="file-icon">{expanded ? '▾' : '▸'}</span>
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
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelectFile(entry.path)}
        onDoubleClick={() => onDoubleClickFile?.(entry.path)}
      >
        <span className="file-icon">📄</span>
        <span className="file-name">{entry.name}</span>
      </div>
    </div>
  )
}

function FolderRoot({
  folderPath,
  files,
  currentFile,
  onSelectFile,
  onDoubleClickFile,
  onRemoveFolder
}: {
  folderPath: string
  files: FileEntry[]
  currentFile: string | null
  onSelectFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
  onRemoveFolder?: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const displayName = folderPath.split('/').slice(-2).join('/')

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Remove "${displayName}" from workspace?`)) {
      onRemoveFolder?.(folderPath)
    }
  }

  return (
    <div className="folder-root">
      <div className="folder-root-row" onClick={() => setExpanded(!expanded)}>
        <span className="file-icon">{expanded ? '▾' : '▸'}</span>
        <span className="folder-root-name">{displayName}</span>
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
              onSelectFile={onSelectFile}
              onDoubleClickFile={onDoubleClickFile}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ folders, currentFile, onSelectFile, onDoubleClickFile, onRemoveFolder }: Props) {
  if (folders.length === 0) {
    return <p className="sidebar-empty">No folders added yet.</p>
  }

  return (
    <div className="file-tree">
      {folders.map(({ path, files }) => (
        <FolderRoot
          key={path}
          folderPath={path}
          files={files}
          currentFile={currentFile}
          onSelectFile={onSelectFile}
          onDoubleClickFile={onDoubleClickFile}
          onRemoveFolder={onRemoveFolder}
        />
      ))}
    </div>
  )
}
