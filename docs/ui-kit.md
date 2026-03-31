# Markup UI Kit

Design system reference for the Markup editor. All values defined as CSS custom properties in `src/renderer/src/styles.css`.

## Colors

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#111113` | App background |
| `--bg-surface` | `#18181b` | Sidebar, panels |
| `--bg-elevated` | `#202023` | Cards, inputs, elevated surfaces |
| `--bg-hover` | `#27272a` | Hover state for interactive elements |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text` | `#e4e4e7` | Primary text (zinc-200) |
| `--text-secondary` | `#a1a1aa` | Secondary text, labels (zinc-400) |
| `--text-muted` | `#63636e` | Muted text, hints, placeholders |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#6366f1` | Primary brand color (indigo-500) |
| `--accent-hover` | `#818cf8` | Hover/active state (indigo-400) |
| `--accent-subtle` | `rgba(99, 102, 241, 0.08)` | Subtle accent backgrounds |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `rgba(255, 255, 255, 0.06)` | Default borders |
| `--border-strong` | `rgba(255, 255, 255, 0.1)` | Emphasized borders |

### Comments
| Token | Value | Usage |
|-------|-------|-------|
| `--comment-bg` | `#1c1c22` | Comment panel background |
| `--comment-border` | `rgba(99, 102, 241, 0.2)` | Comment panel borders |
| `--badge-bg` | `#6366f1` | Comment count badge |

### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `--danger` | `#ef4444` | Delete actions, errors (red-500) |
| `--success` | `#22c55e` | Success indicators (green-500) |

## Typography

### Font Families
| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter | Body text, UI elements |
| `--font-heading` | Literata | Rendered markdown headings |
| `--font-mono` | JetBrains Mono | Code blocks, edit mode |

### Font Scale (rendered markdown)
| Element | Size | Weight | Font |
|---------|------|--------|------|
| h1 | 36px | 700 | Literata |
| h2 | 24px | 600 | Literata |
| h3 | 18px | 600 | Literata |
| Body | 15px | 400 | Inter |
| Code | 13px | 400 | JetBrains Mono |
| Small/labels | 12px | 600 | Inter |
| Muted/hints | 10-11px | 400 | Inter |

## Spacing & Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `8px` | Default border radius |
| `--radius-sm` | `4px` | Small elements (buttons, inputs) |

## Icons

All icons use **Lucide Icons** via `lucide-react`. Never use emoji or Unicode symbols.

Common sizes:
- **14px** — sidebar file icons, chevrons, inline action buttons
- **16px** — sidebar header actions (FolderPlus)
- **12px** — comment action icons (Pencil)

Icons used:
- `FileText` — file entries in sidebar
- `ChevronRight` / `ChevronDown` — expand/collapse folders
- `FolderPlus` — add folder button
- `Pencil` — edit comment

## Component Patterns

### Buttons
- **Primary (filled):** `background: var(--accent)`, white text. Used for Save (when dirty), submit actions.
- **Secondary (outline):** `border: 1px solid var(--border-strong)`, `color: var(--text)`. Used for mode toggles, dismiss.
- **Ghost:** `background: none`, `border: none`. Used for inline actions (delete, edit).
- **Disabled:** `opacity: 0.4`, `cursor: default`.

### Panels
- Right panel: `background: var(--bg-surface)`, `border-left: 1px solid var(--border)`.
- Section title: `.panel-title` — 13px, 600 weight, uppercase, letter-spacing 0.05em, `color: var(--text-muted)`.

### Bars (warnings/errors)
- **External change bar:** Indigo accent, 2px bottom border, semi-transparent background.
- **Save error bar:** Red/danger color, same layout pattern.
- Both use `padding: 10px 16px`, `font-size: 13px`, `font-weight: 500`.

## Theme

Markup uses a single dark theme. No light mode. The color palette is zinc-based (greys) with indigo accent.
