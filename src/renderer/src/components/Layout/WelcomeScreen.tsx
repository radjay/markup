import { MarkupLogo } from '../ui/MarkupLogo'

interface Props {
  onOpenFile: () => void
  onAddFolder: () => void
  onConnectRepo?: () => void  // iOS: show "Connect GitHub Repo" instead of "Add Folder"
}

const isIOS = import.meta.env.MODE === 'ios'

export function WelcomeScreen({ onOpenFile, onAddFolder, onConnectRepo }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <MarkupLogo />
        <p>Review AI-generated plans and documents with inline comments.</p>
        <div className="welcome-buttons">
          {isIOS ? (
            <button onClick={onConnectRepo ?? onAddFolder} className="open-button">
              Connect GitHub Repo
            </button>
          ) : (
            <>
              <button onClick={onOpenFile} className="open-button">Open File</button>
              <button onClick={onAddFolder} className="open-button open-button-secondary">Add Folder</button>
            </>
          )}
        </div>
        {!isIOS && <p className="shortcut-hint">or drag a file or folder here</p>}
      </div>
    </div>
  )
}
