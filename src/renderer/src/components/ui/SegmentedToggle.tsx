interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'default'
}

export function SegmentedToggle({ options, value, onChange, size = 'default' }: Props) {
  const className = `segmented-toggle${size === 'sm' ? ' segmented-toggle--sm' : ''}`

  return (
    <div className={className}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`segmented-toggle-button ${opt.value === value ? 'active' : ''}`}
          onClick={() => opt.value !== value && onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
