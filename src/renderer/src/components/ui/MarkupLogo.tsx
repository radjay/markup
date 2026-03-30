export function MarkupLogo({ width = 40, height = 25 }: { width?: number; height?: number }) {
  return (
    <svg className="welcome-icon" width={width} height={height} viewBox="0 0 208 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M193 5H15C9.47715 5 5 9.47715 5 15V113C5 118.523 9.47715 123 15 123H193C198.523 123 203 118.523 203 113V15C203 9.47715 198.523 5 193 5Z" stroke="currentColor" strokeWidth="10"/>
      <path d="M155 30L185 63H165V98H145V63H125L155 30Z" fill="currentColor"/>
      <path d="M30 98V30H50L70 55L90 30H110V98H90V59L70 84L50 59V98H30Z" fill="currentColor"/>
    </svg>
  )
}
