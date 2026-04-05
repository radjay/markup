import {
  GitHubAPIError,
  GitHubAuthError,
  GitHubForbiddenError,
  GitHubNotFoundError,
  GitHubConflictError,
  GitHubRepo,
  GitHubTreeEntry,
} from './types'

const BASE_URL = 'https://api.github.com'

export class GitHubClient {
  constructor(private token: string) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    }
  }

  private async request<T>(url: string, options?: RequestInit): Promise<{ data: T; headers: Headers }> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.headers(),
        ...(options?.headers as Record<string, string> | undefined),
      },
    })

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText)
      switch (res.status) {
        case 401:
          throw new GitHubAuthError(message, res.status)
        case 403:
          throw new GitHubForbiddenError(message, res.status)
        case 404:
          throw new GitHubNotFoundError(message, res.status)
        case 409:
          throw new GitHubConflictError(message, res.status)
        default:
          throw new GitHubAPIError(message, res.status)
      }
    }

    const data = (await res.json()) as T
    return { data, headers: res.headers }
  }

  async getAuthenticatedUser(): Promise<{ login: string; name?: string }> {
    const { data } = await this.request<{ login: string; name?: string }>(
      `${BASE_URL}/user`
    )
    return { login: data.login, name: data.name }
  }

  async listRepos(): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = []
    let url: string | null = `${BASE_URL}/user/repos?per_page=100&sort=updated`

    while (url) {
      const res = await fetch(url, { headers: this.headers() })

      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText)
        switch (res.status) {
          case 401:
            throw new GitHubAuthError(message, res.status)
          case 403:
            throw new GitHubForbiddenError(message, res.status)
          case 404:
            throw new GitHubNotFoundError(message, res.status)
          case 409:
            throw new GitHubConflictError(message, res.status)
          default:
            throw new GitHubAPIError(message, res.status)
        }
      }

      const page = (await res.json()) as Array<{
        id: number
        owner: { login: string }
        name: string
        default_branch: string
      }>

      for (const r of page) {
        repos.push({
          id: String(r.id),
          owner: r.owner.login,
          repo: r.name,
          branch: r.default_branch,
        })
      }

      // Follow Link header pagination
      const linkHeader = res.headers.get('Link')
      url = parseLinkNext(linkHeader)
    }

    return repos
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const { data } = await this.request<Array<{ name: string }>>(
      `${BASE_URL}/repos/${owner}/${repo}/branches?per_page=100`
    )
    return data.map((b) => b.name)
  }

  async getBranchSha(owner: string, repo: string, branch: string): Promise<string> {
    // Step 1: get commit SHA from branch
    const { data: branchData } = await this.request<{
      commit: { sha: string }
    }>(`${BASE_URL}/repos/${owner}/${repo}/branches/${branch}`)

    const commitSha = branchData.commit.sha

    // Step 2: get tree SHA from commit
    const { data: commitData } = await this.request<{
      tree: { sha: string }
    }>(`${BASE_URL}/repos/${owner}/${repo}/git/commits/${commitSha}`)

    return commitData.tree.sha
  }

  async getRepoTree(
    owner: string,
    repo: string,
    treeSha: string,
    rootPath?: string
  ): Promise<GitHubTreeEntry[]> {
    const { data } = await this.request<{
      tree: Array<{
        path: string
        type: string
        sha: string
        size?: number
      }>
      truncated: boolean
    }>(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`)

    let entries = data.tree
      .filter((e) => e.type === 'blob' && e.path.endsWith('.md'))
      .map((e) => ({
        path: e.path,
        type: 'blob' as const,
        sha: e.sha,
        size: e.size,
      }))

    if (rootPath) {
      const prefix = rootPath.endsWith('/') ? rootPath : rootPath + '/'
      entries = entries.filter((e) => e.path.startsWith(prefix))
    }

    return entries
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<{ content: string; sha: string }> {
    const url = ref
      ? `${BASE_URL}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`
      : `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`

    const { data } = await this.request<{
      content: string
      sha: string
      encoding: string
    }>(url)

    // GitHub returns base64-encoded content with newlines
    const decoded = atob(data.content.replace(/\n/g, ''))
    return { content: decoded, sha: data.sha }
  }

  async putFileContent(
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha: string,
    message: string
  ): Promise<{ sha: string }> {
    // UTF-8 safe base64 encoding
    const bytes = new TextEncoder().encode(content)
    const encoded = btoa(String.fromCharCode(...Array.from(bytes)))

    const { data } = await this.request<{
      content: { sha: string }
    }>(`${BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encoded, sha }),
    })

    return { sha: data.content.sha }
  }
}

function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  // Link header format: <url>; rel="next", <url>; rel="last"
  const parts = linkHeader.split(',')
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/)
    if (match) return match[1]
  }
  return null
}
