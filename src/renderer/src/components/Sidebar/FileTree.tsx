import { useState } from 'react'
import type { FileEntry } from '../../../../shared/types'

interface Props {
  files: FileEntry[]
  currentFile: string | null
  onSelectFile: (path: string) => void
}

function FileNode({
  entry,
  currentFile,
  onSelectFile,
  depth
}: {
  entry: FileEntry
  currentFile: string | null
  onSelectFile: (path: string) => void
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
      >
        <span className="file-icon">📄</span>
        <span className="file-name">{entry.name}</span>
      </div>
    </div>
  )
}

export function FileTree({ files, currentFile, onSelectFile }: Props) {
  if (files.length === 0) {
    return <p className="sidebar-empty">No markdown files found.</p>
  }

  return (
    <div className="file-tree">
      {files.map((entry) => (
        <FileNode
          key={entry.path}
          entry={entry}
          currentFile={currentFile}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </div>
  )
}
