interface Props {
  onReload: () => void
  onDismiss: () => void
}

export function ExternalChangeBar({ onReload, onDismiss }: Props) {
  return (
    <div className="external-change-bar">
      <span>This file was modified externally.</span>
      <button onClick={onReload}>Reload</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}
