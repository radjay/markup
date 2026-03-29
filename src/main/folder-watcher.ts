import chokidar, { type FSWatcher } from 'chokidar'
import { stat, readdir } from 'fs/promises'
import { join, extname, basename, relative } from 'path'
import { BrowserWindow } from 'electron'
import { IPC } from '../shared/ipc-channels'

export interface WatchedFile {
  path: string
  name: string
  folder: string
  folderName: string
  relativePath: string
  mtime: number
}

const watchers: Map<string, FSWatcher> = new Map()

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

function isMd(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return ext === '.md' || ext === '.markdown'
}

function folderDisplayName(folderPath: string): string {
  const parts = folderPath.split('/').filter(Boolean)
  // Show last 3 segments for better context (e.g., "radjay/dev/markup")
  return parts.slice(-3).join('/')
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

// Recursively collect all .md files in a folder with their mtimes
async function collectMdFiles(
  dir: string,
  rootFolder: string,
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
        const children = await collectMdFiles(fullPath, rootFolder, depth + 1)
        results.push(...children)
      } else if (isMd(entry.name)) {
        try {
          const stats = await stat(fullPath)
          results.push({
            path: fullPath,
            name: entry.name,
            folder: rootFolder,
            folderName: folderDisplayName(rootFolder),
            relativePath: relative(rootFolder, fullPath),
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
    const files = await collectMdFiles(folder, folder)
    allFiles.push(...files)
  }

  // Sort by mtime descending
  allFiles.sort((a, b) => b.mtime - a.mtime)

  return allFiles
}
