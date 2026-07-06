import { LockIcon } from '../shared/LockIcon.tsx'

export type RevealStatus = 'idle' | 'signing' | 'decrypting' | 'revealed'

type RevealButtonProps = {
  status: RevealStatus
  onReveal: () => void
}

export function RevealButton({ status, onReveal }: RevealButtonProps) {
  if (status === 'signing') {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-medium text-white opacity-80"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        Requesting signature...
      </button>
    )
  }

  if (status === 'decrypting') {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-medium text-white opacity-80"
      >
        <LockIcon pulsing />
        Decrypting your balance...
      </button>
    )
  }

  if (status === 'revealed') return null

  return (
    <button
      type="button"
      onClick={onReveal}
      className="w-full rounded-xl bg-accent px-4 py-3.5 text-sm font-medium text-white hover:bg-accent-hover"
    >
      Reveal balance
    </button>
  )
}
