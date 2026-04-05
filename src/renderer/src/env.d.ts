/// <reference types="vite/client" />

// window.electronAPI is only present in Electron (non-iOS) builds.
// Do not access it directly outside of ElectronFileService.ts;
// use useFileService() instead for platform-agnostic code.
import type { ElectronAPI } from '../../preload/index'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
