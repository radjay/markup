---
title: "iOS Build and Distribution Guide"
date: 2026-04-05
---

# iOS Build and Distribution Guide

How to build, sign, and distribute the Markup iOS app.

## Prerequisites

- macOS with Xcode 15 or later installed
- A paid [Apple Developer account](https://developer.apple.com/programs/)
- Node.js 18+ and `npm install` run at the repo root
- An App Store Connect app record created for `com.markup.app.ios`

## First-time setup

### 1. Build the web bundle

```bash
npm run build:ios
```

This runs Vite with `vite.config.capacitor.ts` (mode `ios`) and outputs to `dist/ios/`.

### 2. Add the iOS Xcode project

```bash
npx cap add ios
```

This generates the `ios/` directory. Commit it — it is the Xcode project, not a generated artifact.

### 3. Copy config files

After `cap add ios`, copy the template files into the Xcode project:

```bash
cp ios-templates/PrivacyInfo.xcprivacy ios/App/App/PrivacyInfo.xcprivacy
cp ios-templates/Markup.entitlements   ios/App/App/Markup.entitlements
```

Then in Xcode:
- Select the `App` target → **Build Settings** → search "Code Signing Entitlements"
- Set the value to `App/Markup.entitlements`
- Add `PrivacyInfo.xcprivacy` to the `App/App` group in the Project Navigator

### 4. Configure Info.plist

Open `ios/App/App/Info.plist` and verify / add:

```xml
<!-- App display name -->
<key>CFBundleDisplayName</key>
<string>Markup</string>

<!-- Allow outbound HTTPS to api.github.com -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>api.github.com</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <false/>
      <key>NSExceptionMinimumTLSVersion</key>
      <string>TLSv1.2</string>
    </dict>
  </dict>
</dict>
```

### 5. Generate app icons

Install `capacitor-assets` and generate all required sizes from the source icon:

```bash
npm install -D capacitor-assets
npx capacitor-assets generate --ios
```

Source file: `assets/icon.icns` (or provide a 1024×1024 PNG as `assets/icon.png`).

### 6. Sync and open in Xcode

```bash
npm run cap:sync   # copies dist/ios + plugins into ios/
npm run cap:open   # opens ios/App/App.xcworkspace in Xcode
```

## Development workflow

For live-reload during development:

```bash
# Terminal 1 — Vite dev server
npx vite --config vite.config.capacitor.ts --mode ios

# Terminal 2 — run on connected device or simulator
npm run cap:run
```

Capacitor detects the Vite dev server on `localhost:5173` and enables live-reload.

After any `npm install` or dependency change, always run:

```bash
npm run cap:sync
```

## Signing and provisioning

Markup uses **automatic signing** in Xcode:

1. In Xcode, select the `App` target → **Signing & Capabilities**
2. Check **Automatically manage signing**
3. Select your Apple Developer team
4. Xcode fetches and installs provisioning profiles automatically

For CI/CD, use `xcodebuild` with manual signing or [Fastlane Match](https://docs.fastlane.tools/actions/match/).

## Build for distribution

### Ad-hoc / TestFlight

```bash
npm run build:ios
npm run cap:sync
```

Then in Xcode:
- **Product → Archive**
- In the Organizer, click **Distribute App → TestFlight**

Or add a `dist:ios` script to `package.json` using `xcodebuild archive`:

```bash
xcodebuild archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -destination "generic/platform=iOS" \
  -archivePath build/Markup.xcarchive
```

### App Store

1. Archive as above
2. In Organizer → **Distribute App → App Store Connect**
3. Follow the upload wizard
4. In App Store Connect, submit for review

**Before submitting**, ensure:
- A privacy policy URL is set in App Store Connect (add one to `site/`)
- App screenshots are uploaded for iPhone 6.5" and iPad 12.9"
- The `NSHumanReadableDescription` key is filled in `Info.plist`

## App IDs

| Platform | Bundle ID |
|----------|-----------|
| Electron (macOS) | `com.markup.app` |
| iOS | `com.markup.app.ios` |

Separate IDs prevent conflicts when both apps are installed.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `dist/ios/` missing after `cap:sync` | Run `npm run build:ios` first |
| WKWebView shows blank white screen | Check browser console in Safari → Develop → Simulator for JS errors |
| 409 conflict on first save | PAT needs `Contents: write` scope — regenerate with correct permissions |
| Keyboard covers CodeMirror | `visualViewport` handler in `EditorPane.tsx` should adjust; verify `env(safe-area-inset-bottom)` is set |
| `@capacitor/preferences` not found | Run `npm install` then `npm run cap:sync` |
