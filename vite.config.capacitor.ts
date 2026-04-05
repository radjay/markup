import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone Vite config for the iOS/Capacitor renderer bundle.
// Does NOT use electron-vite — outputs a plain web bundle to dist/ios.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  define: {
    // Ensure import.meta.env.MODE is set to 'ios' at build time
    'import.meta.env.MODE': JSON.stringify('ios'),
    // Stub out Node/Electron globals that should never be reached in the
    // iOS bundle but may be referenced by lazy imports
    __dirname: JSON.stringify(''),
    'process.env': JSON.stringify({})
  },
  build: {
    outDir: resolve(__dirname, 'dist/ios'),
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', 'electron-vite']
    }
  }
})
