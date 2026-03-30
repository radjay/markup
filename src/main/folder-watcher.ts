import chokidar, { type FSWatcher } from 'chokidar'
import { stat, readdir, readFile } from 'fs/promises'
import { join, extname, basename, relative, dirname } from 'path'
import { existsSync } from 'fs'
import { BrowserWindow } from 'electron'
import { IPC } from '../shared/ipc-channels'

export interface WatchedFile {
  path: string
  name: string
  folder: string
  repoName: string
  repoBranch: string
  repoPath: string  // path relative to git repo root (e.g., "docs/plans")
  mtime: number
}

const watchers: Map<string, FSWatcher> = new Map()

// Cache git info per folder to avoid repeated filesystem lookups
const gitInfoCache: Map<string, { root: string; name: string; branch: string }> = new Map()

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

function isMd(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return ext === '.md' || ext === '.markdown'
}

// Walk up from a path to find the .git directory
function findGitRoot(startPath: string): string | null {
  let dir = startPath
  while (dir !== '/') {
    if (existsSync(join(dir, '.git'))) return dir
    dir = dirname(dir)
  }
  return null
}

async function getGitInfo(folder: string): Promise<{ root: string; name: string; branch: string }> {
  const cached = gitInfoCache.get(folder)
  if (cached) return cached

  const gitRoot = findGitRoot(folder)
  if (!gitRoot) {
    const fallback = { root: folder, name: basename(folder), branch: '' }
    gitInfoCache.set(folder, fallback)
    return fallback
  }

  const name = basename(gitRoot)
  let branch = ''
  try {
    const head = await readFile(join(gitRoot, '.git', 'HEAD'), 'utf-8')
    const match = head.trim().match(/^ref: refs\/heads\/(.+)$/)
    branch = match ? match[1] : head.trim().slice(0, 8) // detached HEAD: show short hash
  } catch { /* ignore */ }

  const info = { root: gitRoot, name, branch }
  gitInfoCache.set(folder, info)
  return info
}

export function startWatching(folders: string[]): void {
  stopAllWatching()

  for (const folder of folders) {
    // Watch only .md files using a glob — avoids opening file descriptors for every file
    const watcher = chokidar.watch(join(folder, '**/*.md'), {
      ignored: [
        /(^|[/\\])\./,
        /node_modules/,
        /\.git/,
        /\bout\//,
        /\bdist\//,
        /\brelease\//
      ],
      persistent: true,
      ignoreInitial: true,
      depth: 5,
      usePolling: false
    })

    watcher.on('add', (filePath) => {
      if (isMd(filePath)) {
        const win = getMainWindow()
        if (win) win.webContents.send(IPC.FILE_ADDED, filePath, folder)
      }
    })

    watcher.on('change', (filePath) => {
      if (isMd(filePath)) {
        const win = getMainWindow()
        if (win) win.webContents.send(IPC.FILE_CHANGED, filePath, folder)
      }
    })

    watcher.on('unlink', (filePath) => {
      if (isMd(filePath)) {
        const win = getMainWindow()
        if (win) win.webContents.send(IPC.FILE_REMOVED, filePath, folder)
      }
    })

    watchers.set(folder, watcher)
  }
}

export function stopAllWatching(): void {
  for (const w of watchers.values()) w.close()
  watchers.clear()
}

export function addFolder(folder: string): void {
  if (watchers.has(folder)) return
  startWatching([...Array.from(watchers.keys()), folder])
}

export function removeFolder(folder: string): void {
  const watcher = watchers.get(folder)
  if (watcher) {
    watcher.close()
    watchers.delete(folder)
  }
}

async function collectMdFiles(
  dir: string,
  rootFolder: string,
  gitInfo: { root: string; name: string; branch: string },
  depth = 0
): Promise<WatchedFile[]> {
  if (depth > 10) return []

  const results: WatchedFile[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      if (['node_modules', '.git', 'out', 'dist', 'release'].includes(entry.name)) continue

      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        const children = await collectMdFiles(fullPath, rootFolder, gitInfo, depth + 1)
        results.push(...children)
      } else if (isMd(entry.name)) {
        try {
          const stats = await stat(fullPath)
          const relToRepo = relative(gitInfo.root, fullPath)
          const parentDir = dirname(relToRepo)

          results.push({
            path: fullPath,
            name: entry.name,
            folder: rootFolder,
            repoName: gitInfo.name,
            repoBranch: gitInfo.branch,
            repoPath: parentDir === '.' ? '' : parentDir,
            mtime: stats.mtimeMs
          })
        } catch { /* file may have been deleted */ }
      }
    }
  } catch { /* directory may not be readable */ }

  return results
}

export async function listRecentFiles(folders: string[]): Promise<WatchedFile[]> {
  const allFiles: WatchedFile[] = []

  for (const folder of folders) {
    const gitInfo = await getGitInfo(folder)
    const files = await collectMdFiles(folder, folder, gitInfo)
    allFiles.push(...files)
  }

  allFiles.sort((a, b) => b.mtime - a.mtime)
  return allFiles
}

// Clear cached git info (e.g., when branch changes)
export function clearGitCache(): void {
  gitInfoCache.clear()
}
