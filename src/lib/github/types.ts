export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

export class GitHubAuthError extends GitHubAPIError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubForbiddenError extends GitHubAPIError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'GitHubForbiddenError'
  }
}

export class GitHubNotFoundError extends GitHubAPIError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'GitHubNotFoundError'
  }
}

export class GitHubConflictError extends GitHubAPIError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'GitHubConflictError'
  }
}

// GitHubRepo is defined in src/shared/types.ts — import from there, not here

export interface GitHubTreeEntry {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

export interface GitHubFileContent {
  content: string
  sha: string
  encoding: string
}
