import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { SegmentedToggle } from '../ui/SegmentedToggle'
import type { WorkspaceSettings, GitHubRepo } from '../../../../shared/types'

interface Props {
  settings: WorkspaceSettings
  onSettingChange: <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => void
  onClose: () => void
  // iOS-only props
  pat?: string | null
  onPATChange?: (token: string) => void
  repos?: GitHubRepo[]
  onAddRepo?: () => void
  onRemoveRepo?: (id: string) => void
}

const isIOS = import.meta.env.MODE === 'ios'

const iconOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const modeOptions = [
  { value: 'review', label: 'Review' },
  { value: 'edit', label: 'Edit' }
]

export function SettingsModal({
  settings, onSettingChange, onClose,
  pat, onPATChange, repos, onAddRepo, onRemoveRepo
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [patInput, setPatInput] = useState(pat ?? '')
  const [showPAT, setShowPAT] = useState(false)

  useEffect(() => {
    setPatInput(pat ?? '')
  }, [pat])

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

  const handlePATSave = () => {
    onPATChange?.(patInput.trim())
  }

  return (
    <div className="settings-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="settings-body">
          {/* GitHub PAT — iOS only */}
          {onPATChange && (
            <div className="settings-section">
              <h3 className="settings-section-title">GitHub</h3>
              <div className="settings-row">
                <div className="settings-label">
                  <span className="settings-label-text">Personal Access Token</span>
                  <span className="settings-label-hint">Stored securely in the iOS Keychain</span>
                </div>
                <div className="settings-pat-row">
                  <input
                    type={showPAT ? 'text' : 'password'}
                    className="settings-text-input settings-pat-input"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="ghp_…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    className="settings-number-btn"
                    onClick={() => setShowPAT((s) => !s)}
                    title={showPAT ? 'Hide token' : 'Show token'}
                  >
                    {showPAT ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button className="open-button" style={{ padding: '4px 10px', fontSize: 13 }} onClick={handlePATSave}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connected Repos — iOS only */}
          {repos !== undefined && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h3 className="settings-section-title">Connected Repos</h3>
                {onAddRepo && (
                  <button className="open-button open-button-secondary" style={{ padding: '4px 10px', fontSize: 13 }} onClick={onAddRepo}>
                    + Add
                  </button>
                )}
              </div>
              {repos.length === 0 ? (
                <p className="settings-empty-hint">No repos connected yet.</p>
              ) : (
                <div className="settings-repo-list">
                  {repos.map((repo) => (
                    <div key={repo.id} className="settings-repo-row">
                      <div className="settings-repo-info">
                        <span className="settings-repo-name">{repo.owner}/{repo.repo}</span>
                        <span className="settings-repo-meta">
                          {repo.branch}{repo.rootPath ? ` · ${repo.rootPath}` : ''}
                        </span>
                      </div>
                      {onRemoveRepo && (
                        <button
                          className="folder-remove"
                          onClick={() => {
                            if (confirm(`Remove ${repo.owner}/${repo.repo}?`)) {
                              onRemoveRepo(repo.id)
                            }
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* App Icon — desktop only */}
          {!isIOS && (
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
          )}

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
