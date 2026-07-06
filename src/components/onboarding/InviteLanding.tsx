import type { Invite } from '../../types/api.ts'
import { VeilLogo } from '../shared/VeilLogo.tsx'
import { WalletButton } from '../shared/WalletButton.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'

type InviteLandingProps = {
  invite: Invite | null
  isLoading: boolean
  isError: boolean
  isConnected: boolean
  onTwitterSignIn: () => void
}

export function InviteLanding({
  invite,
  isLoading,
  isError,
  isConnected,
  onTwitterSignIn,
}: InviteLandingProps) {
  if (isLoading) return <Skeleton className="h-64 w-full max-w-md rounded-2xl" />

  if (isError || !invite) {
    return (
      <p className="text-sm text-negative">Unable to load invite.</p>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <div className="mb-6 flex justify-center">
        <VeilLogo size="md" showWordmark={false} />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {invite.inviterName} invited you
      </h1>
      <p className="mt-2 text-lg text-muted">{invite.groupName}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Split expenses privately. Amounts stay encrypted on-chain.
      </p>

      <div className="mt-8 space-y-3">
        <WalletButton />
        <button
          type="button"
          onClick={onTwitterSignIn}
          className="veil-btn-secondary w-full"
        >
          Sign in with Twitter first
        </button>
      </div>

      {isConnected && (
        <p className="mt-6 text-sm text-positive">Wallet connected. Joining group…</p>
      )}
    </div>
  )
}
