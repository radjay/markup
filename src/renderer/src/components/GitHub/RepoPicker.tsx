import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { GitHubRepo } from '../../../../shared/types'
import type { GitHubFileService } from '../../../../lib/platform/GitHubFileService'

interface Props {
  githubService: GitHubFileService
  onAdd: (repo: GitHubRepo) => void
  onClose: () => void
}

interface RepoInfo {
  owner: string
  repo: string
  branch: string
}

type Step = 'repo' | 'branch'

export function RepoPicker({ githubService, onAdd, onClose }: Props) {
  const [step, setStep] = useState<Step>('repo')
  const [repos, setRepos] = useState<RepoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<RepoInfo | null>(null)

  const [branches, setBranches] = useState<string[]>([])
  const [branchLoading, setBranchLoading] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [rootPath, setRootPath] = useState('')

  // Load repos on mount
  useEffect(() => {
    setLoading(true)
    githubService.listAvailableRepos()
      .then((r) => { setRepos(r); setLoading(false) })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load repos')
        setLoading(false)
      })
  }, [githubService])

  const handleSelectRepo = useCallback(async (repo: RepoInfo) => {
    setSelected(repo)
    setStep('branch')
    setBranchLoading(true)
    try {
      const list = await githubService.listBranches(repo.owner, repo.repo)
      setBranches(list)
      setSelectedBranch(repo.branch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches')
    } finally {
      setBranchLoading(false)
    }
  }, [githubService])

  const handleConfirm = useCallback(() => {
    if (!selected) return
    const newRepo: GitHubRepo = {
      id: nanoid(),
      owner: selected.owner,
      repo: selected.repo,
      branch: selectedBranch || selected.branch,
      rootPath: rootPath.trim() || undefined,
    }
    onAdd(newRepo)
  }, [selected, selectedBranch, rootPath, onAdd])

  const filteredRepos = repos.filter((r) =>
    `${r.owner}/${r.repo}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-modal repo-picker-modal">
        <div className="settings-header">
          <h2 className="settings-title">
            {step === 'repo' ? 'Connect GitHub Repo' : `${selected?.owner}/${selected?.repo}`}
          </h2>
          <button className="settings-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="settings-body">
          {error && <p className="repo-picker-error">{error}</p>}

          {step === 'repo' && (
            <>
              <div className="repo-picker-search">
                <Search size={14} className="repo-picker-search-icon" />
                <input
                  type="text"
                  className="repo-picker-search-input"
                  placeholder="Filter repos…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {loading ? (
                <p className="repo-picker-loading">Loading repositories…</p>
              ) : (
                <div className="repo-picker-list">
                  {filteredRepos.length === 0 ? (
                    <p className="repo-picker-empty">No repositories found.</p>
                  ) : (
                    filteredRepos.map((r) => (
                      <button
                        key={`${r.owner}/${r.repo}`}
                        className="repo-picker-item"
                        onClick={() => handleSelectRepo(r)}
                      >
                        <span className="repo-picker-name">{r.owner}/{r.repo}</span>
                        <span className="repo-picker-branch">{r.branch}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {step === 'branch' && (
            <>
              <div className="settings-row">
                <div className="settings-label">
                  <span className="settings-label-text">Branch</span>
                  <span className="settings-label-hint">Which branch to read files from</span>
                </div>
                <div className="repo-picker-select-wrap">
                  <select
                    className="repo-picker-select"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={branchLoading}
                  >
                    {branchLoading ? (
                      <option>Loading…</option>
                    ) : (
                      branches.map((b) => <option key={b} value={b}>{b}</option>)
                    )}
                  </select>
                  <ChevronDown size={14} className="repo-picker-select-icon" />
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label">
                  <span className="settings-label-text">Root Path</span>
                  <span className="settings-label-hint">Optional subdirectory (e.g. docs/plans)</span>
                </div>
                <input
                  type="text"
                  className="settings-text-input"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder="Leave blank for repo root"
                />
              </div>

              <div className="repo-picker-actions">
                <button className="open-button open-button-secondary" onClick={() => setStep('repo')}>
                  Back
                </button>
                <button className="open-button" onClick={handleConfirm} disabled={branchLoading}>
                  Add Repo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
