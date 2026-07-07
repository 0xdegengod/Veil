import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useAuth } from '../../hooks/useAuth.ts'
import { useConfidentialUsdc } from '../../hooks/useConfidentialUsdc.ts'
import { useThemeStore } from '../../store/theme.ts'
import { AccountMenuCusd, AccountMenuCusdBadge } from './AccountMenuCusd.tsx'
import { MoonIcon, SunIcon, UserIcon } from './NavItems.tsx'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

type AccountMenuProps = {
  setupComplete: boolean
}

export function AccountMenu({ setupComplete }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { address, chainId } = useAccount()
  const auth = useAuth(address, chainId)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const cusd = useConfidentialUsdc()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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

        const initial = connected
          ? (auth.profile?.displayName ?? account.address).charAt(0).toUpperCase()
          : null

        const title = connected
          ? auth.profile?.handle
            ? `@${auth.profile.handle}`
            : account.displayName ?? shortenAddress(account.address)
          : 'Account'

        return (
          <div ref={rootRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface pl-1 pr-2 text-sm transition hover:bg-surface-raised"
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {initial ?? <UserIcon className="size-4" />}
              </span>
              {connected && setupComplete && (
                <AccountMenuCusdBadge
                  units={cusd.units}
                  isRevealed={cusd.isRevealed}
                  hasEncryptedBalance={cusd.hasEncryptedBalance}
                />
              )}
              <ChevronIcon open={open} />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              >
                <div className="border-b border-border/60 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{title}</p>
                  {connected && (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                      {shortenAddress(account.address)}
                    </p>
                  )}
                  {!connected && (
                    <p className="mt-0.5 text-xs text-muted">Connect to get started</p>
                  )}
                </div>

                {connected && setupComplete && (
                  <AccountMenuCusd
                    units={cusd.units}
                    isRevealed={cusd.isRevealed}
                    hasEncryptedBalance={cusd.hasEncryptedBalance}
                    revealStatus={cusd.revealStatus}
                    unwrapStatus={cusd.unwrapStatus}
                    isUnwrapping={cusd.isUnwrapping}
                    onReveal={cusd.reveal}
                    onUnwrap={cusd.unwrap}
                  />
                )}

                {!connected && (
                  <MenuButton
                    onClick={() => {
                      openConnectModal()
                      setOpen(false)
                    }}
                    primary
                  >
                    Connect wallet
                  </MenuButton>
                )}

                {connected && chain.unsupported && (
                  <MenuButton
                    onClick={() => {
                      openChainModal()
                      setOpen(false)
                    }}
                    danger
                  >
                    Switch network
                  </MenuButton>
                )}

                {setupComplete ? (
                  <MenuLink to="/profile" onClick={() => setOpen(false)}>
                    Profile
                  </MenuLink>
                ) : (
                  <MenuItem disabled>Profile</MenuItem>
                )}

                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm text-foreground">Appearance</span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-raised hover:text-foreground"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                  </button>
                </div>

                {connected && !chain.unsupported && (
                  <MenuButton
                    onClick={() => {
                      openAccountModal()
                      setOpen(false)
                    }}
                  >
                    Wallet settings
                  </MenuButton>
                )}
              </div>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

function MenuLink({
  to,
  onClick,
  children,
}: {
  to: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      role="menuitem"
      onClick={onClick}
      className="block px-3 py-2.5 text-sm text-foreground transition hover:bg-surface-raised"
    >
      {children}
    </NavLink>
  )
}

function MenuButton({
  onClick,
  children,
  primary,
  danger,
}: {
  onClick: () => void
  children: ReactNode
  primary?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-surface-raised ${
        primary
          ? 'font-medium text-accent'
          : danger
            ? 'text-negative'
            : 'text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function MenuItem({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <span
      className={`block px-3 py-2.5 text-sm ${
        disabled ? 'cursor-not-allowed text-muted/40' : 'text-foreground'
      }`}
    >
      {children}
    </span>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`size-4 text-muted transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}
