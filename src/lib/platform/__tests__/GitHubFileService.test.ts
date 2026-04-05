import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubFileService } from '../GitHubFileService'
import type { CapacitorStorageService } from '../CapacitorStorageService'
import type { WorkspaceSettings, GitHubRepo } from '../../../shared/types'
import { GitHubNotFoundError, GitHubConflictError, GitHubAuthError } from '../../github/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: { get: () => null },
  })
}

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return btoa(String.fromCharCode(...Array.from(bytes)))
}

const REPO: GitHubRepo = {
  id: 'repo-abc',
  owner: 'acme',
  repo: 'plans',
  branch: 'main',
}

const REPO_WITH_ROOT: GitHubRepo = {
  id: 'repo-xyz',
  owner: 'acme',
  repo: 'plans',
  branch: 'main',
  rootPath: 'docs/plans',
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  folders: [],
  repos: [REPO],
  sidebarMode: 'recent',
  autosave: true,
  appIcon: 'light',
  defaultMode: 'review',
  fontSize: 15,
  authorName: '',
  rightPanelOpen: false,
}

function makeStorageMock(
  settings: WorkspaceSettings = DEFAULT_SETTINGS,
  pat: string | null = 'ghp_test'
): CapacitorStorageService {
  return {
    getPAT: vi.fn().mockResolvedValue(pat),
    setPAT: vi.fn().mockResolvedValue(undefined),
    clearPAT: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(settings),
    saveSettings: vi.fn().mockResolvedValue(undefined),
  } as unknown as CapacitorStorageService
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('GitHubFileService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ── readFile ────────────────────────────────────────────────────────────────

  describe('readFile', () => {
    it('returns { content, sha } for a valid path', async () => {
      const rawContent = '# Hello World\n'
      globalThis.fetch = makeFetch({
        content: base64Encode(rawContent) + '\n',
        sha: 'blob-sha-123',
        encoding: 'base64',
      })

      const svc = new GitHubFileService(makeStorageMock())
      const result = await svc.readFile('repo-abc', 'docs/plans/foo.md')

      expect(result.content).toBe(rawContent)
      expect(result.sha).toBe('blob-sha-123')
      expect(result.filePath).toBe('docs/plans/foo.md')
    })

    it('propagates GitHubNotFoundError when file does not exist', async () => {
      globalThis.fetch = makeFetch({ message: 'Not Found' }, 404)

      const svc = new GitHubFileService(makeStorageMock())
      await expect(svc.readFile('repo-abc', 'missing.md')).rejects.toBeInstanceOf(GitHubNotFoundError)
    })

    it('throws GitHubAuthError when no PAT is configured', async () => {
      const svc = new GitHubFileService(makeStorageMock(DEFAULT_SETTINGS, null))
      await expect(svc.readFile('repo-abc', 'foo.md')).rejects.toBeInstanceOf(GitHubAuthError)
    })

    it('throws GitHubNotFoundError when workspaceId is not in settings', async () => {
      const svc = new GitHubFileService(makeStorageMock())
      await expect(svc.readFile('nonexistent-id', 'foo.md')).rejects.toBeInstanceOf(GitHubNotFoundError)
    })
  })

  // ── saveFile ────────────────────────────────────────────────────────────────

  describe('saveFile', () => {
    it('calls putFileContent with correct path and sha; returns new sha', async () => {
      const fetchMock = makeFetch({ content: { sha: 'new-sha-456' } })
      globalThis.fetch = fetchMock

      const svc = new GitHubFileService(makeStorageMock())
      const result = await svc.saveFile('repo-abc', 'docs/plans/foo.md', '# Updated\n', 'old-sha-123')

      expect(result.sha).toBe('new-sha-456')

      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/repos/acme/plans/contents/docs/plans/foo.md')
      expect(opts.method).toBe('PUT')

      const body = JSON.parse(opts.body as string)
      expect(body.sha).toBe('old-sha-123')
      expect(body.message).toBe('Markup review: foo.md')
      expect(typeof body.content).toBe('string')
      // Content should be valid base64
      expect(() => atob(body.content)).not.toThrow()
    })

    it('propagates GitHubConflictError on 409 (stale sha)', async () => {
      globalThis.fetch = makeFetch({ message: 'Conflict' }, 409)

      const svc = new GitHubFileService(makeStorageMock())
      await expect(
        svc.saveFile('repo-abc', 'foo.md', '# Content', 'stale-sha')
      ).rejects.toBeInstanceOf(GitHubConflictError)
    })
  })

  // ── listDirectory ───────────────────────────────────────────────────────────

  describe('listDirectory', () => {
    it('returns FileEntry[] with tree structure from GitHub tree response', async () => {
      const fetchMock = vi.fn()
        // getBranchSha: step 1 — branch endpoint
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ commit: { sha: 'commit-sha' } }),
          headers: { get: () => null },
        })
        // getBranchSha: step 2 — commit endpoint
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ tree: { sha: 'tree-sha' } }),
          headers: { get: () => null },
        })
        // getRepoTree
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({
            tree: [
              { path: 'docs/plans/foo.md', type: 'blob', sha: 'blob1' },
              { path: 'docs/plans/bar.md', type: 'blob', sha: 'blob2' },
              { path: 'README.md', type: 'blob', sha: 'blob3' },
              { path: 'src/index.ts', type: 'blob', sha: 'blob4' }, // not .md, filtered out
            ],
            truncated: false,
          }),
          headers: { get: () => null },
        })
      globalThis.fetch = fetchMock

      const svc = new GitHubFileService(makeStorageMock())
      const entries = await svc.listDirectory('repo-abc')

      // Should have a 'docs' dir at root
      const docsDir = entries.find((e) => e.name === 'docs')
      expect(docsDir).toBeDefined()
      expect(docsDir?.isDirectory).toBe(true)

      // README.md at root
      const readme = entries.find((e) => e.name === 'README.md')
      expect(readme).toBeDefined()
      expect(readme?.isDirectory).toBe(false)
    })

    it('excludes entries outside rootPath when repo has rootPath set', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ commit: { sha: 'commit-sha' } }),
          headers: { get: () => null },
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ tree: { sha: 'tree-sha' } }),
          headers: { get: () => null },
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({
            tree: [
              { path: 'docs/plans/foo.md', type: 'blob', sha: 'blob1' },
              { path: 'README.md', type: 'blob', sha: 'blob2' },
            ],
            truncated: false,
          }),
          headers: { get: () => null },
        })
      globalThis.fetch = fetchMock

      const settings: WorkspaceSettings = { ...DEFAULT_SETTINGS, repos: [REPO_WITH_ROOT] }
      const svc = new GitHubFileService(makeStorageMock(settings))
      const entries = await svc.listDirectory('repo-xyz')

      // Only docs/plans/foo.md should be included (rootPath filter)
      // README.md is outside docs/plans, excluded
      const allPaths: string[] = []
      function collectPaths(items: typeof entries) {
        for (const e of items) {
          allPaths.push(e.path)
          if (e.children) collectPaths(e.children)
        }
      }
      collectPaths(entries)
      expect(allPaths.some((p) => p.includes('README.md'))).toBe(false)
      expect(allPaths.some((p) => p.includes('foo.md'))).toBe(true)
    })
  })

  // ── no-op stubs ─────────────────────────────────────────────────────────────

  describe('no-op stubs', () => {
    it('onFileChanged returns a callable cleanup function', async () => {
      const svc = new GitHubFileService(makeStorageMock())
      const cleanup = svc.onFileChanged(() => {})
      expect(() => cleanup()).not.toThrow()
    })

    it('watchFile and unwatchFile resolve without error', async () => {
      const svc = new GitHubFileService(makeStorageMock())
      await expect(svc.watchFile('foo.md')).resolves.toBeUndefined()
      await expect(svc.unwatchFile('foo.md')).resolves.toBeUndefined()
    })

    it('listRecentFiles returns an empty array', async () => {
      const svc = new GitHubFileService(makeStorageMock())
      const files = await svc.listRecentFiles()
      expect(files).toEqual([])
    })
  })

  // ── getWorkspaceMetadata ────────────────────────────────────────────────────

  describe('getWorkspaceMetadata', () => {
    it('returns { name, branch } keyed by repo id without API calls', async () => {
      const svc = new GitHubFileService(makeStorageMock())
      const meta = await svc.getWorkspaceMetadata()

      expect(meta['repo-abc']).toEqual({ name: 'plans', branch: 'main' })
    })
  })

  // ── removeWorkspace ─────────────────────────────────────────────────────────

  describe('removeWorkspace', () => {
    it('removes the repo from settings and persists', async () => {
      const storage = makeStorageMock()
      const svc = new GitHubFileService(storage)
      await svc.removeWorkspace('repo-abc')

      const [savedSettings] = (storage.saveSettings as ReturnType<typeof vi.fn>).mock.calls[0] as [WorkspaceSettings]
      expect(savedSettings.repos.find((r) => r.id === 'repo-abc')).toBeUndefined()
    })
  })

  // ── saveSettings / loadSettings ─────────────────────────────────────────────

  describe('settings', () => {
    it('loadSettings merges stored settings with defaults', async () => {
      const partial = { repos: [REPO], sidebarMode: 'recent' as const }
      const storage = makeStorageMock(partial as WorkspaceSettings)
      const svc = new GitHubFileService(storage)
      const settings = await svc.loadSettings()

      expect(settings.repos).toEqual([REPO])
      expect(settings.fontSize).toBe(15) // default
    })

    it('saveSettings persists and updates cache so subsequent loadSettings is consistent', async () => {
      const storage = makeStorageMock()
      const svc = new GitHubFileService(storage)
      await svc.loadSettings() // prime cache

      const updated = { ...DEFAULT_SETTINGS, authorName: 'Tester' }
      await svc.saveSettings(updated)

      const reloaded = await svc.loadSettings()
      expect(reloaded.authorName).toBe('Tester')
    })
  })

  // ── integration: read → comment → save sha propagation ─────────────────────

  describe('integration', () => {
    it('read returns sha; save is called with that sha and returns new sha', async () => {
      const originalSha = 'original-sha'
      const newSha = 'updated-sha'
      const content = '# Plan\n'

      const fetchMock = vi.fn()
        // readFile → getFileContent
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({
            content: base64Encode(content) + '\n',
            sha: originalSha,
            encoding: 'base64',
          }),
          headers: { get: () => null },
        })
        // saveFile → putFileContent
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ content: { sha: newSha } }),
          headers: { get: () => null },
        })
      globalThis.fetch = fetchMock

      const svc = new GitHubFileService(makeStorageMock())
      const readResult = await svc.readFile('repo-abc', 'plan.md')

      expect(readResult.sha).toBe(originalSha)

      const saveResult = await svc.saveFile('repo-abc', 'plan.md', readResult.content, readResult.sha)

      expect(saveResult.sha).toBe(newSha)

      // Verify putFileContent was called with the original sha
      const [, opts] = fetchMock.mock.calls[1] as [string, RequestInit]
      const body = JSON.parse(opts.body as string)
      expect(body.sha).toBe(originalSha)
    })
  })
})
