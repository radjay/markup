import { useEffect, useState } from 'react'
import type { WatchedFile } from '../../../../shared/types'

interface Props {
  files: WatchedFile[]
  currentFile: string | null
  viewedFiles: Set<string>
  onSelectFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
}

function relativeTime(mtime: number): string {
  const diff = Date.now() - mtime
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(mtime).toLocaleDateString()
}

export function RecentFiles({ files, currentFile, viewedFiles, onSelectFile, onDoubleClickFile }: Props) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  if (files.length === 0) {
    return <p className="sidebar-empty">No markdown files found.</p>
  }

  // Flat list sorted by mtime descending (already sorted from backend)
  return (
    <div className="recent-files">
      {files.map((file) => {
        const isActive = file.path === currentFile
        const isNew = !viewedFiles.has(file.path)

        // Show folder + relative path for context
        const contextPath = file.relativePath.includes('/')
          ? `${file.folderName}/${file.relativePath.substring(0, file.relativePath.lastIndexOf('/'))}`
          : file.folderName

        return (
          <div
            key={file.path}
            className={`recent-file-row ${isActive ? 'active' : ''}`}
            onClick={() => onSelectFile(file.path)}
            onDoubleClick={() => onDoubleClickFile?.(file.path)}
          >
            <div className="recent-file-info">
              {isNew && <span className="new-badge" />}
              <div className="recent-file-details">
                <span className="recent-file-name">{file.name}</span>
                <span className="recent-file-path">{contextPath}</span>
              </div>
            </div>
            <span className="recent-file-time">{relativeTime(file.mtime)}</span>
          </div>
        )
      })}
    </div>
  )
}
