import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { InviteLanding } from '../components/onboarding/InviteLanding.tsx'
import { VeilLogo } from '../components/shared/VeilLogo.tsx'
import { acceptInvite, fetchInvitePreview } from '../lib/api/invites.ts'
import { formatHandle } from '../lib/utils/format.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useWallet } from '../hooks/useWallet.ts'
import { toast } from '../store/toast.ts'
import type { Invite } from '../types/api.ts'

function mapInvite(data: Awaited<ReturnType<typeof fetchInvitePreview>>): Invite {
  return {
    token: data.token,
    groupId: data.groupId,
    groupName: data.groupName,
    inviterName: data.inviterHandle
      ? formatHandle(data.inviterHandle)
      : data.inviterAddress,
  }
}

export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address, chainId, isConnected } = useWallet()
  const auth = useAuth(address, chainId)
  const [joining, setJoining] = useState(false)

  const query = useQuery({
    queryKey: ['invite', token],
    queryFn: () => fetchInvitePreview(token),
    enabled: Boolean(token),
    retry: false,
  })

  const invite = query.data ? mapInvite(query.data) : null

  useEffect(() => {
    if (!token || !invite || !isConnected || !auth.isAuthenticated || !auth.hasProfile) return
    if (joining) return

    setJoining(true)
    void acceptInvite(token)
      .then((result) => {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        toast.success(`Joined ${result.groupName}`)
        navigate(`/groups/${result.groupId}`, { replace: true })
      })
      .catch(() => {
        toast.error('Could not join group. Try signing in again.')
        setJoining(false)
      })
  }, [
    token,
    invite,
    isConnected,
    auth.isAuthenticated,
    auth.hasProfile,
    joining,
    navigate,
    queryClient,
  ])

  const handleSignIn = async () => {
    try {
      await auth.signIn()
    } catch {
      toast.error('Sign in failed')
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link to="/">
          <VeilLogo size="sm" />
        </Link>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <InviteLanding
          invite={invite}
          isLoading={query.isLoading}
          isError={!token || query.isError}
          isConnected={isConnected}
          isAuthenticated={auth.isAuthenticated}
          hasProfile={auth.hasProfile}
          isJoining={joining}
          onSignIn={() => void handleSignIn()}
          onCompleteProfile={() => navigate('/dashboard', { state: { fromInvite: token } })}
        />
      </div>
    </div>
  )
}
