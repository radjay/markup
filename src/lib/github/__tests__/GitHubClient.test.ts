import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from '../GitHubClient'
import {
  GitHubAPIError,
  GitHubAuthError,
  GitHubForbiddenError,
  GitHubNotFoundError,
  GitHubConflictError,
} from '../types'

// ── helpers ────────────────────────────────────────────────────────────────────

function mockFetch(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  })
}

function makeFetchSequence(
  responses: Array<{ body: unknown; status?: number; headers?: Record<string, string> }>
) {
  let call = 0
  return vi.fn().mockImplementation(() => {
    const r = responses[call++] ?? responses[responses.length - 1]
    return Promise.resolve({
      ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
      status: r.status ?? 200,
      statusText: String(r.status ?? 200),
      json: () => Promise.resolve(r.body),
      text: () => Promise.resolve(JSON.stringify(r.body)),
      headers: {
        get: (key: string) => (r.headers ?? {})[key.toLowerCase()] ?? null,
      },
    })
  })
}

// ── setup ──────────────────────────────────────────────────────────────────────

let client: GitHubClient

beforeEach(() => {
  client = new GitHubClient('test-token')
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── getAuthenticatedUser ───────────────────────────────────────────────────────

describe('getAuthenticatedUser', () => {
  it('returns login and name', async () => {
    globalThis.fetch = mockFetch({ login: 'octocat', name: 'The Octocat' })
    const user = await client.getAuthenticatedUser()
    expect(user).toEqual({ login: 'octocat', name: 'The Octocat' })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('throws GitHubAuthError on 401', async () => {
    globalThis.fetch = mockFetch({ message: 'Bad credentials' }, 401)
    await expect(client.getAuthenticatedUser()).rejects.toBeInstanceOf(GitHubAuthError)
  })

  it('throws GitHubForbiddenError on 403', async () => {
    globalThis.fetch = mockFetch({ message: 'Forbidden' }, 403)
    await expect(client.getAuthenticatedUser()).rejects.toBeInstanceOf(GitHubForbiddenError)
  })

  it('throws GitHubNotFoundError on 404', async () => {
    globalThis.fetch = mockFetch({ message: 'Not Found' }, 404)
    await expect(client.getAuthenticatedUser()).rejects.toBeInstanceOf(GitHubNotFoundError)
  })

  it('throws GitHubAPIError on unexpected status', async () => {
    globalThis.fetch = mockFetch({ message: 'Server Error' }, 500)
    const err = await client.getAuthenticatedUser().catch((e) => e)
    expect(err).toBeInstanceOf(GitHubAPIError)
    expect(err.status).toBe(500)
  })
})

// ── listRepos ─────────────────────────────────────────────────────────────────

describe('listRepos', () => {
  it('returns repos from a single page', async () => {
    const rawRepos = [
      { id: 1, owner: { login: 'alice' }, name: 'repo-a', default_branch: 'main' },
      { id: 2, owner: { login: 'alice' }, name: 'repo-b', default_branch: 'dev' },
    ]
    globalThis.fetch = mockFetch(rawRepos)
    const repos = await client.listRepos()
    expect(repos).toHaveLength(2)
    expect(repos[0]).toEqual({ id: '1', owner: 'alice', repo: 'repo-a', branch: 'main' })
    expect(repos[1]).toEqual({ id: '2', owner: 'alice', repo: 'repo-b', branch: 'dev' })
  })

  it('follows Link header pagination', async () => {
    const page1 = [{ id: 1, owner: { login: 'alice' }, name: 'repo-a', default_branch: 'main' }]
    const page2 = [{ id: 2, owner: { login: 'alice' }, name: 'repo-b', default_branch: 'main' }]

    globalThis.fetch = makeFetchSequence([
      { body: page1, headers: { link: '<https://api.github.com/user/repos?page=2>; rel="next"' } },
      { body: page2, headers: {} },
    ])

    const repos = await client.listRepos()
    expect(repos).toHaveLength(2)
    expect(repos[1].repo).toBe('repo-b')
  })

  it('throws GitHubAuthError on 401', async () => {
    globalThis.fetch = mockFetch({ message: 'Bad credentials' }, 401)
    await expect(client.listRepos()).rejects.toBeInstanceOf(GitHubAuthError)
  })
})

// ── listBranches ──────────────────────────────────────────────────────────────

describe('listBranches', () => {
  it('returns branch names', async () => {
    globalThis.fetch = mockFetch([{ name: 'main' }, { name: 'dev' }, { name: 'feat/x' }])
    const branches = await client.listBranches('alice', 'my-repo')
    expect(branches).toEqual(['main', 'dev', 'feat/x'])
  })

  it('throws GitHubNotFoundError on 404', async () => {
    globalThis.fetch = mockFetch({ message: 'Not Found' }, 404)
    await expect(client.listBranches('alice', 'missing')).rejects.toBeInstanceOf(GitHubNotFoundError)
  })
})

// ── getBranchSha ──────────────────────────────────────────────────────────────

describe('getBranchSha', () => {
  it('performs two-step resolution: branch→commit→tree sha', async () => {
    globalThis.fetch = makeFetchSequence([
      { body: { commit: { sha: 'commit-abc' } } },
      { body: { tree: { sha: 'tree-xyz' } } },
    ])

    const sha = await client.getBranchSha('alice', 'my-repo', 'main')
    expect(sha).toBe('tree-xyz')
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('uses correct API paths', async () => {
    const calls: string[] = []
    const fakeFetch = makeFetchSequence([
      { body: { commit: { sha: 'c1' } } },
      { body: { tree: { sha: 't1' } } },
    ])
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: unknown) => {
      calls.push(url)
      return fakeFetch(url, opts)
    })

    await client.getBranchSha('alice', 'repo', 'main')
    expect(calls[0]).toBe('https://api.github.com/repos/alice/repo/branches/main')
    expect(calls[1]).toBe('https://api.github.com/repos/alice/repo/git/commits/c1')
  })

  it('throws GitHubNotFoundError on 404', async () => {
    globalThis.fetch = mockFetch({ message: 'Not Found' }, 404)
    await expect(client.getBranchSha('alice', 'repo', 'missing')).rejects.toBeInstanceOf(
      GitHubNotFoundError
    )
  })
})

// ── getRepoTree ───────────────────────────────────────────────────────────────

describe('getRepoTree', () => {
  const rawTree = {
    truncated: false,
    tree: [
      { path: 'README.md', type: 'blob', sha: 'sha1', size: 100 },
      { path: 'docs/plan.md', type: 'blob', sha: 'sha2', size: 200 },
      { path: 'src/index.ts', type: 'blob', sha: 'sha3', size: 300 },
      { path: 'src', type: 'tree', sha: 'sha4' },
    ],
  }

  it('returns only .md blob entries', async () => {
    globalThis.fetch = mockFetch(rawTree)
    const entries = await client.getRepoTree('alice', 'repo', 'tree-sha')
    expect(entries.every((e) => e.path.endsWith('.md'))).toBe(true)
    expect(entries.every((e) => e.type === 'blob')).toBe(true)
    expect(entries).toHaveLength(2)
  })

  it('filters by rootPath prefix', async () => {
    globalThis.fetch = mockFetch(rawTree)
    const entries = await client.getRepoTree('alice', 'repo', 'tree-sha', 'docs')
    expect(entries).toHaveLength(1)
    expect(entries[0].path).toBe('docs/plan.md')
  })

  it('rootPath with trailing slash also works', async () => {
    globalThis.fetch = mockFetch(rawTree)
    const entries = await client.getRepoTree('alice', 'repo', 'tree-sha', 'docs/')
    expect(entries).toHaveLength(1)
  })

  it('throws GitHubNotFoundError on 404', async () => {
    globalThis.fetch = mockFetch({ message: 'Not Found' }, 404)
    await expect(client.getRepoTree('alice', 'repo', 'bad-sha')).rejects.toBeInstanceOf(
      GitHubNotFoundError
    )
  })
})

// ── getFileContent ────────────────────────────────────────────────────────────

describe('getFileContent', () => {
  it('decodes base64 content and returns sha', async () => {
    // "Hello, world!" base64-encoded
    const b64 = btoa('Hello, world!')
    globalThis.fetch = mockFetch({ content: b64, sha: 'file-sha', encoding: 'base64' })

    const result = await client.getFileContent('alice', 'repo', 'README.md')
    expect(result.content).toBe('Hello, world!')
    expect(result.sha).toBe('file-sha')
  })

  it('handles base64 content with embedded newlines (GitHub style)', async () => {
    const raw = 'Line one\nLine two\n'
    const b64WithNewlines = btoa(raw).replace(/.{76}/g, '$&\n')
    globalThis.fetch = mockFetch({ content: b64WithNewlines, sha: 'sha2', encoding: 'base64' })

    const result = await client.getFileContent('alice', 'repo', 'notes.md')
    expect(result.content).toBe(raw)
  })

  it('appends ref query param when provided', async () => {
    globalThis.fetch = mockFetch({ content: btoa('x'), sha: 's', encoding: 'base64' })
    await client.getFileContent('alice', 'repo', 'file.md', 'main')
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('?ref=main')
  })

  it('throws GitHubNotFoundError on 404', async () => {
    globalThis.fetch = mockFetch({ message: 'Not Found' }, 404)
    await expect(client.getFileContent('alice', 'repo', 'missing.md')).rejects.toBeInstanceOf(
      GitHubNotFoundError
    )
  })
})

// ── putFileContent ────────────────────────────────────────────────────────────

describe('putFileContent', () => {
  it('sends PUT with correct body and returns new sha', async () => {
    globalThis.fetch = mockFetch({ content: { sha: 'new-sha' } })

    const result = await client.putFileContent(
      'alice',
      'repo',
      'README.md',
      'Hello!',
      'old-sha',
      'Update README'
    )
    expect(result.sha).toBe('new-sha')

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[1].method).toBe('PUT')
    const body = JSON.parse(call[1].body)
    expect(body.message).toBe('Update README')
    expect(body.sha).toBe('old-sha')
    expect(atob(body.content)).toBe('Hello!')
  })

  it('encodes UTF-8 content safely (em dash, curly quotes)', async () => {
    globalThis.fetch = mockFetch({ content: { sha: 'sha-utf8' } })
    const fancy = 'Hello \u2014 \u201Cworld\u201D'
    const result = await client.putFileContent('alice', 'repo', 'f.md', fancy, 's', 'msg')
    expect(result.sha).toBe('sha-utf8')

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(call[1].body)
    // Verify round-trip decode via TextDecoder (UTF-8)
    const bytes = Uint8Array.from(atob(body.content), (c) => c.charCodeAt(0))
    const decoded = new TextDecoder().decode(bytes)
    expect(decoded).toBe(fancy)
  })

  it('throws GitHubConflictError on 409', async () => {
    globalThis.fetch = mockFetch({ message: 'Conflict' }, 409)
    await expect(
      client.putFileContent('alice', 'repo', 'f.md', 'x', 'stale-sha', 'msg')
    ).rejects.toBeInstanceOf(GitHubConflictError)
  })

  it('throws GitHubAuthError on 401', async () => {
    globalThis.fetch = mockFetch({ message: 'Unauthorized' }, 401)
    await expect(
      client.putFileContent('alice', 'repo', 'f.md', 'x', 'sha', 'msg')
    ).rejects.toBeInstanceOf(GitHubAuthError)
  })
})
