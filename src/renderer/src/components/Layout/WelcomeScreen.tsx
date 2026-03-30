import { MarkupLogo } from '../ui/MarkupLogo'

interface Props {
  onOpenFile: () => void
  onAddFolder: () => void
}

export function WelcomeScreen({ onOpenFile, onAddFolder }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <MarkupLogo />
        <p>Review AI-generated plans and documents with inline comments.</p>
        <div className="welcome-buttons">
          <button onClick={onOpenFile} className="open-button">Open File</button>
          <button onClick={onAddFolder} className="open-button open-button-secondary">Add Folder</button>
        </div>
        <p className="shortcut-hint">or drag a file or folder here</p>
      </div>
    </div>
  )
}
