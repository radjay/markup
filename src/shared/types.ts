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

export interface WorkspaceSettings {
  folders: string[]
  sidebarMode: 'tree' | 'recent'
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
