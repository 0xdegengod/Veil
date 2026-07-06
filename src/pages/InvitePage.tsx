import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { InviteLanding } from '../components/onboarding/InviteLanding.tsx'
import { VeilLogo } from '../components/shared/VeilLogo.tsx'
import { apiFetch } from '../lib/api/client.ts'
import { formatHandle } from '../lib/utils/format.ts'
import { useWallet } from '../hooks/useWallet.ts'
import type { Invite } from '../types/api.ts'

type InviteResponse = {
  token: string
  groupId: string
  groupName: string
  inviterHandle?: string
  inviterAddress: string
}

async function fetchInvite(token: string): Promise<Invite | null> {
  try {
    const data = await apiFetch<InviteResponse>(`/invites/${token}`)
    return {
      token: data.token,
      groupId: data.groupId,
      groupName: data.groupName,
      inviterName: data.inviterHandle
        ? formatHandle(data.inviterHandle)
        : data.inviterAddress,
    }
  } catch {
    return null
  }
}

export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { isConnected } = useWallet()

  const query = useQuery({
    queryKey: ['invite', token],
    queryFn: () => fetchInvite(token),
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (!isConnected || !query.data) return

    const invite = query.data
    if (invite.groupId) {
      navigate(`/groups/${invite.groupId}`, { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [isConnected, query.data, navigate])

  return (
    <div className="relative min-h-screen">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link to="/">
          <VeilLogo size="sm" />
        </Link>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <InviteLanding
          invite={query.data ?? null}
          isLoading={query.isLoading}
          isError={!token || query.isError || (!query.isLoading && !query.data)}
          isConnected={isConnected}
          onTwitterSignIn={() => {}}
        />
      </div>
    </div>
  )
}
