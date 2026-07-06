import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Confirmation } from '../components/shared/Confirmation.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { SectionCard } from '../components/shared/SectionCard.tsx'
import { Stepper } from '../components/shared/Stepper.tsx'
import { InviteLink } from '../components/group/InviteLink.tsx'
import { MemberSearch } from '../components/group/MemberSearch.tsx'
import { useWallet } from '../hooks/useWallet.ts'
import { searchProfiles } from '../lib/api/profiles.ts'
import { ContractNotConfiguredError } from '../lib/contracts/actions/createGroup.ts'
import { createGroupFlow } from '../lib/services/createGroup.ts'
import { toast } from '../store/toast.ts'
import type { Member } from '../types/contracts.ts'

const STEPS = ['Name', 'Settings', 'Members']

type Created = {
  id: string
  name: string
  inviteUrl: string
  memberCount: number
}

export function NewGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address, chainId } = useWallet()

  const [step, setStep] = useState(0)
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [created, setCreated] = useState<Created | null>(null)
  const [creating, setCreating] = useState(false)

  const canContinue = step === 0 ? groupName.trim().length > 0 : true

  const handleCreate = async () => {
    setCreating(true)
    try {
      if (!chainId) throw new Error('wallet_not_connected')

      const result = await createGroupFlow({
        chainId,
        name: groupName.trim(),
        description: description.trim() || undefined,
        members,
      })

      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(`${result.group.name} created on-chain`)
      setCreated({
        id: result.group.id,
        name: result.group.name,
        inviteUrl: `${window.location.origin}/invite/${result.inviteToken}`,
        memberCount: result.members.length,
      })
    } catch (err) {
      if (err instanceof ContractNotConfiguredError) {
        toast.error('Contracts not deployed. Set addresses in .env.')
      } else {
        toast.error('Could not create group')
      }
    } finally {
      setCreating(false)
    }
  }

  if (created) {
    return (
      <div className="veil-page">
        <div className="mx-auto max-w-lg">
          <Confirmation
            icon="🎉"
            title={`${created.name} created`}
            lines={[
              created.memberCount > 1
                ? `${created.memberCount} members in the group`
                : 'Invite members with the link below',
            ]}
            primaryAction={{
              label: 'Open group',
              onClick: () => navigate(`/groups/${created.id}`),
            }}
            secondaryAction={{
              label: 'Go to dashboard',
              onClick: () => navigate('/dashboard'),
            }}
          />
          <div className="mt-6">
            <InviteLink
              inviteUrl={created.inviteUrl}
              groupName={created.name}
              onCopy={() => navigator.clipboard.writeText(created.inviteUrl)}
              onShareTwitter={() => {}}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="veil-page">
      <div className="mx-auto max-w-lg">
      <PageHeader
        title="New group"
        description="Set a name, add members, and create the group on-chain."
      />

      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      <SectionCard>
        {step === 0 && (
          <div className="space-y-5">
            <label className="block text-left text-sm font-medium text-foreground">
              Group name
              <input
                autoFocus
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Roommates, Trip to Lisbon…"
                className="veil-input"
              />
            </label>
            <label className="block text-left text-sm font-medium text-foreground">
              Description <span className="font-normal text-muted">(optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What is this group for?"
                className="veil-input resize-none"
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="rounded-lg border border-border-subtle bg-surface-raised/40 p-4 text-left text-sm leading-relaxed text-muted">
              Amounts stay encrypted end-to-end. In this version, you settle expense shares
              directly to the payer on Sepolia ETH.
            </p>
            <p className="text-left text-xs text-muted">
              Next: add members by @handle. You&apos;re added automatically as the admin.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-left text-sm font-medium text-foreground">Add members</p>
            <MemberSearch
              selected={members}
              excludeAddress={address}
              search={searchProfiles}
              onAdd={(member) => setMembers((prev) => [...prev, member])}
              onRemove={(address) =>
                setMembers((prev) => prev.filter((m) => m.address !== address))
              }
              onInvite={() => {}}
            />
            <p className="text-left text-xs text-muted">
              You&apos;re added automatically as the group admin. You can also invite
              people with a link after creating the group.
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="veil-btn-secondary flex-1"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="veil-btn-primary flex-1 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="veil-btn-primary flex-1 disabled:opacity-50"
            >
              {creating ? 'Creating on-chain…' : 'Create group'}
            </button>
          )}
        </div>
      </SectionCard>
      </div>
    </div>
  )
}
