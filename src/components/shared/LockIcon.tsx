type LockIconProps = {
  pulsing?: boolean
  className?: string
}

export function LockIcon({ pulsing = false, className = '' }: LockIconProps) {
  return (
    <span
      className={`inline-block text-locked ${pulsing ? 'animate-pulse' : ''} ${className}`}
      aria-hidden="true"
    >
      🔒
    </span>
  )
}
