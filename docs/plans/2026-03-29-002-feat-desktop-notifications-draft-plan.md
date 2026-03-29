---
title: "feat: Desktop Notifications for New Agent Files"
type: feat
status: draft
date: 2026-03-29
---

# Desktop Notifications for New Agent Files

## Overview

Notify the user when an agent writes a new `.md` file in a watched folder. Uses Electron's `Notification` API. Only fires when the app is not focused. Clicking the notification opens the file in Markup.

## Prerequisites

Depends on the workspace sidebar feature (folder watching with chokidar).

## Scope

- Use Electron's `Notification` API
- Only notify for new files (not changes to existing)
- Only when the app is not focused
- Clicking the notification focuses the app and opens the file

## Files to change

- [ ] `src/main/folder-watcher.ts` — trigger notification on new file when app is blurred
- [ ] `src/main/index.ts` — notification click handler
