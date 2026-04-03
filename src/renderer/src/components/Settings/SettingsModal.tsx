import { useEffect, useRef } from 'react'
import { SegmentedToggle } from '../ui/SegmentedToggle'
import type { WorkspaceSettings } from '../../../../shared/types'

interface Props {
  settings: WorkspaceSettings
  onSettingChange: <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => void
  onClose: () => void
}

const iconOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const modeOptions = [
  { value: 'review', label: 'Review' },
  { value: 'edit', label: 'Edit' }
]

export function SettingsModal({ settings, onSettingChange, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className="settings-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-body">
          <div className="settings-row">
            <div className="settings-label">
              <span className="settings-label-text">App Icon</span>
              <span className="settings-label-hint">Dock and window icon variant</span>
            </div>
            <SegmentedToggle
              options={iconOptions}
              value={settings.appIcon}
              onChange={(v) => onSettingChange('appIcon', v as 'light' | 'dark')}
            />
          </div>

          <div className="settings-row">
            <div className="settings-label">
              <span className="settings-label-text">Default Mode</span>
              <span className="settings-label-hint">Mode when opening a new file</span>
            </div>
            <SegmentedToggle
              options={modeOptions}
              value={settings.defaultMode}
              onChange={(v) => onSettingChange('defaultMode', v as 'review' | 'edit')}
            />
          </div>

          <div className="settings-row">
            <div className="settings-label">
              <span className="settings-label-text">Font Size</span>
              <span className="settings-label-hint">Base font size for markdown rendering</span>
            </div>
            <div className="settings-number-input">
              <button
                className="settings-number-btn"
                onClick={() => onSettingChange('fontSize', Math.max(10, settings.fontSize - 1))}
              >
                -
              </button>
              <span className="settings-number-value">{settings.fontSize}px</span>
              <button
                className="settings-number-btn"
                onClick={() => onSettingChange('fontSize', Math.min(24, settings.fontSize + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-label">
              <span className="settings-label-text">Author Name</span>
              <span className="settings-label-hint">Used in @markup comments</span>
            </div>
            <input
              type="text"
              className="settings-text-input"
              value={settings.authorName}
              onChange={(e) => onSettingChange('authorName', e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
