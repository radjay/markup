---
title: "feat: Single-Page Marketing Website for Markup"
type: "feat"
status: "active"
date: "2026-04-03"
markup_reviewed: true
markup_reviewed_at: "2026-04-03T06:55:02.643Z"
markup_status: "approved"
---
# Single-Page Marketing Website for Markup

## Overview

Build a world-class single-page marketing site for Markup — a native macOS app for reviewing AI-generated markdown documents. The site should communicate what Markup does, show it in action, and get developers to download it. Dark, minimal, developer-focused — matching the app's own aesthetic.

## Problem Statement

Markup has no web presence. Developers discovering it via GitHub, Twitter/X, or Hacker News have no visual, branded landing page to understand the product. The README is decent but could be stronger. A polished site converts curiosity into installs — and a tightened README reinforces that for developers who land on the repo directly.

## Target Audience

Developers who use AI coding agents (Claude Code, Cursor, Copilot, etc.) and review agent-generated markdown plans and documents.

## Proposed Solution

A single `site/` directory in the repo containing a static, single-page website built with **vanilla HTML + CSS + minimal JS**. No framework, no build step, no dependencies. Deployed to **GitHub Pages**.

### Why vanilla HTML/CSS?

- Zero dependencies = zero maintenance burden
- A single page doesn't need React, Astro, or any framework
- Matches the "tool for developers" ethos — no bloat
- Instant load, perfect Lighthouse scores
- Can be deployed to GitHub Pages with zero config

## Design Direction

### Visual Identity

Match the app's dark theme to create a cohesive brand experience:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-app` | `#111113` | Page background |
| `--bg-surface` | `#18181b` | Card/section backgrounds |
| `--bg-elevated` | `#1e1e22` | Elevated surfaces, code blocks |
| `--accent` | `#6366f1` | CTAs, highlights, links |
| `--accent-hover` | `#818cf8` | Hover states |
| `--text-primary` | `#fafafa` | Headings |
| `--text-secondary` | `#a1a1aa` | Body text |
| `--text-muted` | `#71717a` | Captions, labels |
| `--border` | `#27272a` | Borders, dividers |
| `--radius` | `8px` | Border radius |

### Typography

Use the same fonts from the app (self-hosted from `assets/fonts/`):

- **Literata** — Hero heading and section titles
- **Inter** — Body text, descriptions, UI labels
- **JetBrains Mono** — Code snippets, technical details

### Inspiration & Quality Bar

The site should feel like a premium developer tool page. Reference points:
- [Linear](https://linear.app) — dark, clean, focused messaging
- [Warp](https://warp.dev) — developer-focused, strong visuals
- [Raycast](https://raycast.com) — elegant product shots, clear value prop
- [Cursor](https://cursor.com) — AI-tool positioning done well

Key design principles:
- **Generous whitespace** — let the content breathe
- **One hero screenshot** — the app speaks for itself
- **Subtle animations** — fade-in on scroll, nothing flashy
- **Mobile-responsive** — content adapts; download CTA adjusts for non-Mac visitors

## Page Structure

### 1. Navigation Bar (sticky)

```
[M logo]  Markup                              [GitHub ↗]  [Download]
```

- Logo: inline SVG from `assets/icon.svg` (simplified/adapted for small size)
- "Markup" wordmark in Inter SemiBold
- GitHub link (icon + text, opens in new tab)
- Download button (primary CTA, indigo accent)

### 2. Hero Section

```
                    Review AI plans.
                 Leave feedback that sticks.

    A native macOS app for reviewing markdown from AI coding agents.
    Comment on any section. Save. The agent picks up your feedback.

              [Download for macOS]    [View on GitHub]

                   [App screenshot]
```

- Large heading in Literata, ~48-56px
- Subheading in Inter, `--text-secondary`, ~18-20px
- Two CTAs: primary (Download) and secondary (GitHub)
- Full-width app screenshot below CTAs, with a subtle shadow/glow and rounded corners
- Screenshot should show: rendered markdown document with an inline comment panel open (use the user-provided screenshot as the hero image)

### 3. How It Works (5-step flow)

A horizontal or vertical sequence showing the review loop:

```
1. Agent generates     2. Open in Markup     3. Click to comment
   a markdown plan        — rendered,            on any block
                           not raw text

4. Save — comments     5. Agent reads &
   embedded invisibly     addresses feedback
```

- Each step: icon (Lucide) + short title + one-line description
- Visual connector between steps (line or arrow)
- Optionally highlight step 3 with a mini-screenshot showing the comment UI

### 4. Features Section

Three feature cards in a grid:

**Review**
- Beautiful markdown rendering (Literata headings, Inter body, JetBrains Mono code)
- Click any block to add inline comments
- Document-level comments for general feedback
- Icon: `MessageSquare` from Lucide

**Navigate**
- Multi-folder workspace
- Tree view + Recently Updated (live-refreshing)
- Tabbed editor with VS Code-style preview mode
- Icon: `FolderTree` from Lucide

**Edit**
- Toggle Review/Edit mode (Cmd+E)
- CodeMirror 6 with syntax highlighting
- File watching — detects external changes
- Icon: `Pencil` from Lucide

### 5. The Secret Sauce — Comment Format

A technical section for developers who want to understand how it works:

```
Your comments become part of the file — invisible to other renderers,
machine-parseable by agents.
```

Show a code block with the `@markup` comment format:

```html
## Architecture
<!-- @markup {"id":"c1","type":"inline","anchor":"h2:Architecture","author":"","ts":"2026-04-03T06:53:50.016Z"} Consider a modular monolith instead. -->

The system uses microservices.

```

With a callout: "No database. No sync service. Just the file."

### 6. Open Source + CTA Footer

```
                    Free and open source.
                Built for the agent era.

                  [Download for macOS]

          MIT License  ·  GitHub  ·  macOS (Apple Silicon)
```

- Final download CTA
- Platform badge (macOS Apple Silicon)
- MIT license mention
- GitHub link
- Subtle copyright line

## Technical Implementation

### File Structure

```
site/
  index.html          # Single page, all content
  styles.css          # All styles (extracted for readability)
  script.js           # Minimal JS (scroll animations, mobile menu)
  assets/
    screenshot.png    # Hero screenshot of the app
    og-image.png      # Open Graph social preview (1200x630)
    icon.svg          # Logo (copied or symlinked from /assets)
  fonts/              # Self-hosted fonts (copied from /assets/fonts)
    Inter-Regular.woff2
    Inter-SemiBold.woff2
    Inter-Bold.woff2
    JetBrainsMono-Regular.woff2
    Literata-Variable.ttf
```

### HTML Structure

Single `index.html` with:
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<footer>`)
- Inline SVG for the logo
- `<picture>` or `<img>` for the screenshot with lazy loading
- Proper heading hierarchy (h1 > h2 > h3)
- ARIA labels where needed

### CSS Approach

- CSS custom properties for the design tokens (matches app's `styles.css`)
- CSS Grid + Flexbox for layout
- `@font-face` declarations for self-hosted fonts
- Responsive breakpoints: mobile (< 640px), tablet (< 1024px), desktop
- Smooth scroll behavior
- Subtle `@keyframes` for fade-in-on-scroll
- Prefers-reduced-motion media query for accessibility
- No CSS framework — hand-crafted for this page

### JavaScript (Minimal)

- Intersection Observer for scroll-triggered fade-in animations
- Mobile navigation toggle (if needed — might not be necessary for a single-page site with only 2 nav links)
- Platform detection to show appropriate download messaging on non-Mac

```js
// Detect non-Mac visitors
if (!navigator.platform.includes('Mac')) {
  // Show "Available for macOS" instead of "Download"
  // Add "View on GitHub" as primary CTA
}
```

### SEO & Meta Tags

```html
<title>Markup — Review AI Plans, Leave Feedback That Sticks</title>
<meta name="description" content="A native macOS app for reviewing markdown documents generated by AI coding agents. Comment on any section, save, and the agent picks up your feedback.">
<meta property="og:title" content="Markup — Review AI Plans">
<meta property="og:description" content="Comment on AI-generated markdown. Save. The agent picks up your feedback.">
<meta property="og:image" content="/assets/og-image.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

### Performance Targets

- Lighthouse: 100/100/100/100
- First Contentful Paint: < 1s
- Total page weight: < 500KB (including screenshot)
- No external requests (fonts self-hosted, no analytics CDN initially)

## Deployment

### GitHub Pages

1. Add a GitHub Actions workflow (`.github/workflows/deploy-site.yml`):

```yaml
name: Deploy Site
on:
  push:
    branches: [main]
    paths: ['site/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
```

2. Enable GitHub Pages in repo settings (source: GitHub Actions)
3. Site available at `radjay.github.io/markup`

### Custom Domain (Future)

- Register `markup.dev` or `getmarkup.app` when ready
- Add CNAME file to `site/` directory
- Update GitHub Pages settings

## Download Strategy

Since the app is not yet code-signed:

1. **Primary CTA**: "Download for macOS" button links to the latest GitHub Release (`.dmg` file)
2. **Install note**: Small text below the button: "Requires macOS · Apple Silicon · [Install help ↗]"
3. **Install help**: Link to a section or GitHub wiki page with Gatekeeper bypass instructions:
   - Right-click the app → Open → Open (to bypass "unidentified developer" warning)
   - Or: `xattr -cr /Applications/Markup.app` in terminal

**Prerequisite**: Create a GitHub Release with the DMG before launching the site.

## Mobile Behavior

- Full content is visible and readable on mobile
- Download CTA changes to "Available for macOS" badge with a link to the GitHub repo
- No email capture for now — keep it simple

## Acceptance Criteria

- [ ] `site/index.html` — single-page marketing site, no build step required
- [ ] `site/styles.css` — hand-crafted CSS using app's design tokens
- [ ] `site/script.js` — minimal JS for scroll animations and platform detection
- [ ] Dark theme matching the app's aesthetic (zinc + indigo palette)
- [ ] Self-hosted Inter, Literata, JetBrains Mono fonts
- [ ] Hero section with app screenshot and two CTAs
- [ ] "How it works" 5-step flow section
- [ ] Feature cards (Review, Navigate, Edit)
- [ ] Comment format technical section with code example
- [ ] Footer with download CTA, GitHub link, license
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Semantic HTML with proper heading hierarchy
- [ ] Open Graph and Twitter Card meta tags
- [ ] OG image (1200x630)
- [ ] Lighthouse score: 95+ across all categories
- [ ] GitHub Actions workflow for deployment to GitHub Pages
- [ ] Platform detection — appropriate messaging for non-Mac visitors
- [ ] Lucide icons only (no emoji, no unicode symbols)
- [ ] `prefers-reduced-motion` respected for animations
- [ ] No external dependencies or CDN requests
- [ ] README.md refreshed — hero screenshot, punchier copy, download link, website badge

## Implementation Phases

### Phase 1: Foundation (Core)

Build the complete page structure and styles:

1. Create `site/` directory with `index.html`, `styles.css`, `script.js`
2. Copy fonts from `assets/fonts/` to `site/fonts/`
3. Copy/adapt icon SVG for web use
4. Build all HTML sections with semantic structure
5. Implement full CSS with design tokens, responsive breakpoints
6. Add scroll animations via Intersection Observer
7. Add platform detection for download CTA

**Files created:**
- `site/index.html`
- `site/styles.css`
- `site/script.js`
- `site/fonts/` (copied from `assets/fonts/`)
- `site/assets/icon.svg`

### Phase 2: Visual Assets

1. Capture hero screenshot of the app (high-res, showing inline comment open)
2. Create OG image (1200x630) — app screenshot with tagline overlay
3. Optimize images (compress PNG, consider WebP with PNG fallback)

**Files created:**
- `site/assets/screenshot.png`
- `site/assets/og-image.png`

### Phase 3: Deployment

1. Create `.github/workflows/deploy-site.yml`
2. Create a GitHub Release with DMG for the download link
3. Enable GitHub Pages in repo settings
4. Verify deployment at `radjay.github.io/markup`
5. Test OG image rendering (use opengraph.xyz or similar)

**Files created:**
- `.github/workflows/deploy-site.yml`

## README Refresh

Alongside the website, strengthen the README to serve as the "second landing page" for developers who find the repo directly.

### Changes

- **Tighten the opening** — punchier one-liner, move the detailed description below
- **Add a hero screenshot** — same one used on the site, right at the top
- **Streamline the feature list** — match the site's 3-pillar structure (Review, Navigate, Edit)
- **Improve install section** — add DMG download link alongside the build-from-source instructions
- **Add a "Website" badge/link** — point to the GitHub Pages site
- **Remove verbose comment format docs** — link to a dedicated section in the wiki or docs instead of inline examples

### Files modified

- `README.md`

## Out of Scope

- Blog or changelog page
- Email capture / waitlist
- Analytics (add later)
- Custom domain setup (add later)
- Video/animated demo (add later — screenshots first)
- Windows/Linux download options
- Pricing or commercial features

## Sources & References

### Internal References

- Design tokens: `docs/ui-kit.md` and `src/renderer/src/styles.css`
- Logo SVG: `assets/icon.svg`
- Logo component: `src/renderer/src/components/ui/MarkupLogo.tsx`
- App icons: `assets/app-icon.png`, `assets/app-icon-dark.png`
- Fonts: `assets/fonts/`
- Product copy: `README.md`
- Roadmap: `docs/versions/roadmap.md`
- GitHub repo: https://github.com/radjay/markup

### Design References

- Linear (linear.app) — dark theme, clean messaging
- Warp (warp.dev) — developer tool positioning
- Raycast (raycast.com) — product screenshots, elegant layout
- Cursor (cursor.com) — AI tool marketing