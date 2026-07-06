import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Profile as ProfileType } from '../types/api.ts'
import { truncateAddress, formatHandle } from '../lib/utils/format.ts'
import { apiFetch } from '../lib/api/client.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { EmptyState } from '../components/shared/EmptyState.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { SectionCard } from '../components/shared/SectionCard.tsx'
import { ThemeToggle } from '../components/shared/ThemeToggle.tsx'
import { TrustBadge } from '../components/shared/TrustBadge.tsx'
import { Skeleton } from '../components/shared/Skeleton.tsx'
import { useTrustScore } from '../lib/contracts/hooks/useTrustScore.ts'
import { useWallet } from '../hooks/useWallet.ts'

async function fetchProfile(): Promise<ProfileType | null> {
  try {
    return await apiFetch<ProfileType>('/profiles/me')
  } catch {
    return null
  }
}

export function Profile() {
  const { address, isConnected, chainId } = useWallet()
  const auth = useAuth(address, chainId)
  const trust = useTrustScore(address)

  const query = useQuery({
    queryKey: ['profile', address],
    queryFn: () => fetchProfile(),
    enabled: true,
  })

  const isLoading = query.isLoading || trust.isLoading
  const isError = query.isError || trust.isError
  const profile = auth.profile ?? query.data

  return (
    <div className="veil-page">
      <PageHeader
        title="Profile"
        description="Your identity and trust score"
        action={<ThemeToggle />}
      />

      {isLoading && <Skeleton className="h-40 rounded-2xl" />}

      {isError && (
        <p className="text-sm text-negative">Unable to load profile.</p>
      )}

      {!isLoading && !isError && !profile && isConnected && address && (
        <SectionCard title="Connected wallet">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised font-mono text-lg text-muted">
              {address.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p className="font-mono text-sm tabular-nums text-foreground">
                {truncateAddress(address)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Complete onboarding to set your @handle
              </p>
            </div>
          </div>
          <Link to="/dashboard" className="veil-btn-secondary mt-5 inline-block w-full text-center">
            Finish setup
          </Link>
        </SectionCard>
      )}

      {!isLoading && !isError && !profile && !isConnected && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="Not connected"
          description="Connect your wallet to view your profile and trust score."
        />
      )}

      {!isLoading && !isError && profile && (
        <SectionCard>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-raised text-xl font-medium text-foreground">
              {profile.displayName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{profile.displayName}</p>
              <p className="mt-0.5 text-sm text-muted">{formatHandle(profile.handle)}</p>
              <p className="mt-2 font-mono text-xs tabular-nums text-muted">
                {truncateAddress(profile.walletAddress)}
              </p>
              {trust.tier && (
                <div className="mt-4">
                  <TrustBadge tier={trust.tier} />
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
