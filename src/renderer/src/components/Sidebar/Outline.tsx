import type { HeadingEntry } from '../../../../shared/types'

interface Props {
  headings: HeadingEntry[]
  onClickHeading: (id: string) => void
}

export function Outline({ headings, onClickHeading }: Props) {
  if (headings.length === 0) return null

  return (
    <div className="outline">
      <h4 className="sidebar-section-title">Outline</h4>
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
    </div>
  )
}
