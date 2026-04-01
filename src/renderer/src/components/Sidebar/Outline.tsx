import { useState } from 'react'
import type { HeadingEntry } from '../../../../shared/types'

interface Props {
  headings: HeadingEntry[]
  onClickHeading: (id: string) => void
}

export function Outline({ headings, onClickHeading }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (headings.length === 0) return null

  return (
    <div className="outline">
      <h3
        className="panel-title"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        Document Outline
      </h3>
      {expanded && (
        <div className="outline-list">
          {headings.map((h) => (
            <div
              key={h.id}
              className={`outline-item outline-level-${h.level}`}
              onClick={() => onClickHeading(h.id)}
            >
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
