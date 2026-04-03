OPEN:

- Tab switching doesn't preserve scroll position. When switching between tabs, the scroll position is lost. Each tab should remember where the user was.

COMPLETED:

- Add border below macOS window buttons to visually separate the title bar region. (5fe8668)

- Add a settings screen with gear button in top-right corner, Cmd+, shortcut, and menu item. Includes app icon picker, default mode, font size, author name. (5fe8668)

- Group recent files by date buckets (Today, Yesterday, This Week, This Month, Older) instead of individual timestamps. (5fe8668)

- Show file path tooltip on hover for files in sidebar, Recent tab, and open tabs. (5fe8668)

- Unify sidebar toggle components — extract shared SegmentedToggle component for Files/Recent and Review/Edit toggles with consistent sizing. (5fe8668)

- Move the "review/edit" toggle to be floating in the right top corner of the document panel, not in the tab bar. (5fe8668)

- False "reload file" bar showing immediately when opening a new markdown file from Claude Code. (5fe8668)

- Right sidebar should be closable and collapsed by default, with persisted state. (5fe8668)

- Open comment UI in doc scrolling back into view when continuing to read the doc. (5fe8668)
