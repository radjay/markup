export const IPC = {
  OPEN_FILE: 'dialog:openFile',
  OPEN_DIRECTORY: 'dialog:openDirectory',
  READ_FILE: 'file:read',
  SAVE_FILE: 'file:save',
  LIST_DIRECTORY: 'file:listDirectory',
  WATCH_FILE: 'file:watch',
  UNWATCH_FILE: 'file:unwatch',
  FILE_CHANGED: 'file:changed',
  FILE_ADDED: 'file:added',
  FILE_REMOVED: 'file:removed',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
  ADD_FOLDER: 'folder:add',
  REMOVE_FOLDER: 'folder:remove',
  LIST_RECENT_FILES: 'folder:listRecent',
  SET_APP_ICON: 'settings:setAppIcon'
} as const
