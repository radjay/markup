import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const theme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#111113',
      color: '#e4e4e7'
    },
    '.cm-cursor': {
      borderLeftColor: '#e4e4e7'
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)'
    },
    '.cm-gutters': {
      backgroundColor: '#111113',
      color: '#63636e',
      border: 'none'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      color: '#a1a1aa'
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(99, 102, 241, 0.2) !important'
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(99, 102, 241, 0.3) !important'
    },
    '.cm-line': {
      padding: '0 16px'
    }
  },
  { dark: true }
)

const highlightStyles = HighlightStyle.define([
  { tag: tags.heading1, color: '#e4e4e7', fontWeight: '700', fontSize: '1.4em' },
  { tag: tags.heading2, color: '#e4e4e7', fontWeight: '600', fontSize: '1.2em' },
  { tag: tags.heading3, color: '#e4e4e7', fontWeight: '600', fontSize: '1.1em' },
  { tag: tags.emphasis, color: '#a5b4fc', fontStyle: 'italic' },
  { tag: tags.strong, color: '#e4e4e7', fontWeight: '700' },
  { tag: tags.link, color: '#818cf8' },
  { tag: tags.url, color: '#818cf8' },
  { tag: tags.monospace, color: '#a5b4fc' },
  { tag: tags.comment, color: '#63636e' },
  { tag: tags.meta, color: '#63636e' },
  { tag: tags.keyword, color: '#c084fc' },
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.processingInstruction, color: '#63636e' }
])

export const oneDark = [theme, syntaxHighlighting(highlightStyles)]
