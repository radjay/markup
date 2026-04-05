import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import type { GitHubRepo } from '../shared/types'

export interface Settings {
  folders: string[]
  repos: GitHubRepo[]
  sidebarMode: 'tree' | 'recent'
  autosave: boolean
  appIcon: 'light' | 'dark'
  defaultMode: 'review' | 'edit'
  fontSize: number
  authorName: string
  rightPanelOpen: boolean
}

const SETTINGS_PATH = join(app.getPath('userData'), 'markup-settings.json')

const defaults: Settings = {
  folders: [],
  repos: [],
  sidebarMode: 'recent',
  autosave: true,
  appIcon: 'light',
  defaultMode: 'review',
  fontSize: 15,
  authorName: '',
  rightPanelOpen: false
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}
