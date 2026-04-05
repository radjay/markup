export interface InlineComment {
  id: string
  type: 'inline'
  anchor: string
  selection?: string
  author: string
  ts: string
  body: string
}

export interface DocumentComment {
  id: string
  type: 'document'
  author: string
  ts: string
  body: string
}

export type MarkupComment = InlineComment | DocumentComment

export interface ReviewMetadata {
  markup_reviewed: boolean
  markup_reviewer: string
  markup_reviewed_at: string
  markup_status: 'approved' | 'changes_requested' | 'commented'
}

export interface FileData {
  filePath: string
  content: string
}

export interface ParsedDocument {
  content: string
  frontmatter: Record<string, unknown>
  inlineComments: InlineComment[]
  documentComments: DocumentComment[]
  reviewMetadata: Partial<ReviewMetadata> | null
}

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: FileEntry[]
}

export interface HeadingEntry {
  level: number
  text: string
  id: string
}

export interface GitHubRepo {
  id: string          // nanoid-generated stable identifier
  owner: string       // GitHub username or org (e.g. "radjay")
  repo: string        // repository name (e.g. "markup")
  branch: string      // branch to read from (e.g. "main")
  rootPath?: string   // optional subdirectory to scope the file tree (e.g. "docs/plans")
}

export interface WorkspaceSettings {
  folders: string[]
  repos: GitHubRepo[]   // default []
  sidebarMode: 'tree' | 'recent'
  autosave: boolean
  appIcon: 'light' | 'dark'
  defaultMode: 'review' | 'edit'
  fontSize: number
  authorName: string
  rightPanelOpen: boolean
}

export interface WatchedFile {
  path: string
  name: string
  folder: string
  repoName: string
  repoBranch: string
  repoPath: string
  mtime: number
}
