import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useAuth } from '../../hooks/useAuth.ts'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, chainId } = useAccount()
  const auth = useAuth(address, chainId)

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        if (!ready) {
          return (
            <div
              className={`${btnBase} h-10 min-w-[7rem] animate-pulse border border-border bg-surface-raised`}
              aria-hidden
            />
          )
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={`${btnBase} veil-btn-primary h-10 px-4 ${compact ? 'text-xs sm:text-sm' : ''}`}
            >
              <WalletIcon className="size-4" />
              <span>{compact ? 'Connect' : 'Connect wallet'}</span>
            </button>
          )
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`${btnBase} h-10 border border-negative/40 bg-negative/10 px-3 text-negative`}
            >
              Wrong network
            </button>
          )
        }

        const label = auth.profile?.handle
          ? `@${auth.profile.handle}`
          : account.displayName ?? shortenAddress(account.address)

        const initial = (auth.profile?.displayName ?? account.address).charAt(0).toUpperCase()

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className={`${btnBase} h-10 max-w-[11rem] border border-border bg-surface px-2.5 text-foreground hover:bg-surface-raised sm:max-w-none sm:px-3`}
            title={account.address}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-xs font-semibold text-accent">
              {initial}
            </span>
            <span className="truncate">{label}</span>
          </button>
        )
      }}
    </ConnectButton.Custom>
  )
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 8V7a3 3 0 013-3h11a2 2 0 012 2v1M4 8h16v10a2 2 0 01-2 2H7a3 3 0 01-3-3V8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}
