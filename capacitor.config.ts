import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.markup.app.ios',
  appName: 'Markup',
  webDir: 'dist/ios',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Preferences: {
      group: 'com.markup.app'
    }
  }
}

export default config
