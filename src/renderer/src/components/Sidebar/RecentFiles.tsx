import { useEffect, useState } from 'react'
import type { WatchedFile } from '../../../../shared/types'

interface Props {
  files: WatchedFile[]
  currentFile: string | null
  viewedFiles: Set<string>
  onSelectFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
}

interface DateBucket {
  label: string
  files: WatchedFile[]
}

function bucketByDate(files: WatchedFile[]): DateBucket[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000

  // Monday of this week
  const dayOfWeek = now.getDay()
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = todayStart - daysSinceMonday * 86400000

  // 1st of this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const buckets: DateBucket[] = [
    { label: 'Today', files: [] },
    { label: 'Yesterday', files: [] },
    { label: 'This Week', files: [] },
    { label: 'This Month', files: [] },
    { label: 'Older', files: [] }
  ]

  for (const file of files) {
    const t = file.mtime
    if (t >= todayStart) {
      buckets[0].files.push(file)
    } else if (t >= yesterdayStart) {
      buckets[1].files.push(file)
    } else if (t >= weekStart) {
      buckets[2].files.push(file)
    } else if (t >= monthStart) {
      buckets[3].files.push(file)
    } else {
      buckets[4].files.push(file)
    }
  }

  return buckets.filter((b) => b.files.length > 0)
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

  const buckets = bucketByDate(files)

  return (
    <div className="recent-files">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="recent-group">
          <div className="recent-group-header">{bucket.label}</div>
          {bucket.files.map((file) => {
            const isActive = file.path === currentFile
            const isNew = !viewedFiles.has(file.path)
            return (
              <div
                key={file.path}
                className={`recent-file-row ${isActive ? 'active' : ''}`}
                title={file.path}
                onClick={() => onSelectFile(file.path)}
                onDoubleClick={() => onDoubleClickFile?.(file.path)}
              >
                <div className="recent-file-info">
                  <div className="recent-file-details">
                    <span className={`recent-file-name ${isNew ? 'is-new' : ''}`}>{file.name}</span>
                    {file.repoPath && <span className="recent-file-path">/{file.repoPath}</span>}
                    <span className="recent-file-repo"><span className="repo-name">{file.repoName}</span>{file.repoBranch && <span className="repo-branch">:{file.repoBranch}</span>}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
