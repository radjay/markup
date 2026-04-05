import { Preferences } from '@capacitor/preferences'
import type { WorkspaceSettings } from '../../shared/types'

const PAT_KEY = 'github.token'
const SETTINGS_KEY = 'markup.settings'

/**
 * Wraps @capacitor/preferences (Keychain-backed on iOS) for PAT storage
 * and local settings persistence.
 */
export class CapacitorStorageService {
  async getPAT(): Promise<string | null> {
    const { value } = await Preferences.get({ key: PAT_KEY })
    return value
  }

  async setPAT(token: string): Promise<void> {
    await Preferences.set({ key: PAT_KEY, value: token })
  }

  async clearPAT(): Promise<void> {
    await Preferences.remove({ key: PAT_KEY })
  }

  async getSettings(): Promise<WorkspaceSettings | null> {
    const { value } = await Preferences.get({ key: SETTINGS_KEY })
    if (!value) return null
    return JSON.parse(value) as WorkspaceSettings
  }

  async saveSettings(settings: WorkspaceSettings): Promise<void> {
    await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
  }
}
