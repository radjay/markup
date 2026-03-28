export const IPC = {
  OPEN_FILE: 'dialog:openFile',
  OPEN_DIRECTORY: 'dialog:openDirectory',
  READ_FILE: 'file:read',
  SAVE_FILE: 'file:save',
  LIST_DIRECTORY: 'file:listDirectory',
  WATCH_FILE: 'file:watch',
  UNWATCH_FILE: 'file:unwatch',
  FILE_CHANGED: 'file:changed'
} as const
