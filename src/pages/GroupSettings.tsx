import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { SectionCard } from '../components/shared/SectionCard.tsx'
import { useGroup } from '../lib/contracts/hooks/useGroup.ts'
import { useWallet } from '../hooks/useWallet.ts'
import {
  leaveGroup,
  removeGroupMember,
  renameGroup,
  transferGroupAdmin,
} from '../lib/api/groups.ts'
import { formatHandle, truncateAddress } from '../lib/utils/format.ts'
import { toast } from '../store/toast.ts'

function isSameAddress(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

export function GroupSettings() {
  const { id: groupId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address } = useWallet()
  const group = useGroup(groupId)

  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (group.group?.name) setName(group.group.name)
  }, [group.group?.name])

  const isAdmin = isSameAddress(group.group?.adminAddress, address)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    queryClient.invalidateQueries({ queryKey: ['groups'] })
  }

  const handleRename = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await renameGroup(groupId, name.trim())
      invalidate()
      toast.success('Group renamed')
    } catch {
      toast.error('Could not rename group')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (memberAddress: string, handle: string) => {
    setBusy(true)
    try {
      await removeGroupMember(groupId, memberAddress)
      invalidate()
      toast.success(`Removed ${formatHandle(handle)}`)
    } catch {
      toast.error('Could not remove member')
    } finally {
      setBusy(false)
    }
  }

  const handleTransfer = async (memberAddress: string, handle: string) => {
    setBusy(true)
    try {
      await transferGroupAdmin(groupId, memberAddress)
      invalidate()
      toast.success(`${formatHandle(handle)} is now admin`)
    } catch {
      toast.error('Could not transfer admin')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    setBusy(true)
    try {
      await leaveGroup(groupId)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.info('You left the group')
      navigate('/dashboard')
    } catch (err) {
      const code =
        err instanceof Error && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === 'forbidden') {
        toast.error('Transfer admin to another member before leaving')
      } else {
        toast.error('Could not leave group')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="veil-page">
      <div className="mb-2">
        <Link to={`/groups/${groupId}`} className="text-sm text-muted transition hover:text-foreground">
          ← Back to group
        </Link>
      </div>

      <PageHeader
        title="Group settings"
        description={group.group?.name ? `Manage ${group.group.name}` : 'Manage this group'}
      />

      <div className="space-y-6">
        <SectionCard title="Group name" description="Only the admin can rename the group">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin || busy}
              className="veil-input mt-0 flex-1 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleRename()}
              disabled={!isAdmin || busy || !name.trim() || name.trim() === group.group?.name}
              className="veil-btn-primary shrink-0 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Members"
          description={`${group.members.length} in this group`}
        >
          <ul className="divide-y divide-border-subtle">
            {group.members.map((member) => {
              const isYou = isSameAddress(member.address, address)
              const memberIsAdmin = isSameAddress(member.address, group.group?.adminAddress)

              return (
                <li key={member.address} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-raised font-mono text-sm text-muted">
                    {member.handle.replace(/^@/, '').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {isYou ? 'You' : formatHandle(member.handle)}
                      </p>
                      {memberIsAdmin && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {truncateAddress(member.address)}
                    </p>
                  </div>

                  {isAdmin && !isYou && (
                    <div className="flex shrink-0 gap-2">
                      {!memberIsAdmin && (
                        <button
                          type="button"
                          onClick={() => void handleTransfer(member.address, member.handle)}
                          disabled={busy}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-foreground disabled:opacity-50"
                        >
                          Make admin
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemove(member.address, member.handle)}
                        disabled={busy}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-negative transition hover:bg-negative/10 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Danger zone" description="Leaving removes your access to this group">
          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={busy}
            className="rounded-xl border border-negative/40 px-5 py-3 text-sm font-medium text-negative transition hover:bg-negative/10 disabled:opacity-50"
          >
            Leave group
          </button>
        </SectionCard>
      </div>
    </div>
  )
}
