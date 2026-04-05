import { createContext, useContext } from 'react'
import type { FileService } from './FileService'

const FileServiceContext = createContext<FileService | null>(null)

export const FileServiceProvider = FileServiceContext.Provider

export function useFileService(): FileService {
  const ctx = useContext(FileServiceContext)
  if (!ctx) {
    throw new Error('useFileService must be used within a FileServiceProvider')
  }
  return ctx
}
