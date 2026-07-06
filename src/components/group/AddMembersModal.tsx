import { useCallback, useMemo, useState } from 'react'
import type { Member } from '../../types/contracts.ts'
import { MemberSearch } from './MemberSearch.tsx'
import { InviteLink } from './InviteLink.tsx'
import { searchProfiles } from '../../lib/api/profiles.ts'
import { addGroupMemberFlow } from '../../lib/services/addGroupMember.ts'
import { ContractNotConfiguredError } from '../../lib/contracts/actions/createGroup.ts'
import { ApiError } from '../../lib/api/client.ts'
import { formatHandle } from '../../lib/utils/format.ts'
import { toast } from '../../store/toast.ts'

type AddMembersModalProps = {
  isOpen: boolean
  groupId: string
  groupName: string
  inviteToken: string
  members: Member[]
  chainGroupId?: number | null
  chainId?: number
  onClose: () => void
  onAdded: () => void
}

export function AddMembersModal({
  isOpen,
  groupId,
  groupName,
  inviteToken,
  members,
  chainGroupId,
  chainId,
  onClose,
  onAdded,
}: AddMembersModalProps) {
  const [adding, setAdding] = useState(false)

  const inviteUrl = `${window.location.origin}/invite/${inviteToken}`

  const existingAddresses = useMemo(
    () => new Set(members.map((m) => m.address.toLowerCase())),
    [members],
  )

  const search = useCallback(
    async (query: string) => {
      const found = await searchProfiles(query)
      return found.filter((m) => !existingAddresses.has(m.address.toLowerCase()))
    },
    [existingAddresses],
  )

  const copyInvite = () => {
    void navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied')
  }

  const handleAdd = async (member: Member) => {
    if (adding) return
    if (existingAddresses.has(member.address.toLowerCase())) {
      toast.error('Already in this group')
      return
    }

    setAdding(true)
    try {
      await addGroupMemberFlow({
        groupId,
        member,
        chainId,
        chainGroupId,
      })
      onAdded()
      toast.success(`Added ${formatHandle(member.handle)}`)
    } catch (err) {
      if (err instanceof ContractNotConfiguredError) {
        toast.error('Group registry not configured')
      } else if (err instanceof ApiError) {
        if (err.code === 'forbidden') {
          toast.error('Only the group admin can add members')
        } else if (err.code === 'unauthorized') {
          toast.error('Session expired. Sign in again.')
        } else {
          toast.error('Could not add member')
        }
      } else if (err instanceof Error) {
        if (err.message === 'group_not_on_chain') {
          toast.error('Group is not linked on-chain yet')
        } else if (err.message === 'wallet_not_connected') {
          toast.error('Connect your wallet to add members')
        } else {
          toast.error('Could not add member')
        }
      } else {
        toast.error('Could not add member')
      }
    } finally {
      setAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 lg:items-center lg:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-6 lg:rounded-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Add members</h2>
            <p className="mt-1 text-sm text-muted">
              Search by handle or share the invite link
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="text-muted transition hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className={adding ? 'pointer-events-none opacity-60' : undefined}>
          <MemberSearch
            selected={[]}
            search={search}
            onAdd={(member) => {
              void handleAdd(member)
            }}
            onRemove={() => {}}
            onInvite={() => copyInvite()}
          />
        </div>

        {adding && (
          <p className="mt-3 text-sm text-muted">Confirm membership in your wallet…</p>
        )}

        <div className="mt-6 border-t border-border-subtle pt-6">
          <InviteLink
            inviteUrl={inviteUrl}
            groupName={groupName}
            onCopy={copyInvite}
            onShareTwitter={() => {
              const text = encodeURIComponent(`Join ${groupName} on Veil`)
              const url = encodeURIComponent(inviteUrl)
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
            }}
          />
        </div>
      </div>
    </div>
  )
}
