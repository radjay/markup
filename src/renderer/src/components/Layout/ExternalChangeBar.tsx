interface Props {
  hasUnsavedChanges: boolean
  onReload: () => void
  onDismiss: () => void
}

export function ExternalChangeBar({ hasUnsavedChanges, onReload, onDismiss }: Props) {
  const handleReload = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Reload will discard them. Continue?')) {
      return
    }
    onReload()
  }

  return (
    <div className="external-change-bar">
      <span>This file was modified externally.</span>
      <button onClick={handleReload}>Reload</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}
