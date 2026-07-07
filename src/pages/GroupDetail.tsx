import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { MyActions } from '../components/balance/MyActions.tsx'
import { ExpenseFeed } from '../components/expenses/ExpenseFeed.tsx'
import { ExpenseDetailSheet } from '../components/expenses/ExpenseDetailSheet.tsx'
import { FlagExpenseModal } from '../components/expenses/FlagExpenseModal.tsx'
import { ExpenseForm, type ExpenseFormStatus, type ExpenseSplit } from '../components/expenses/ExpenseForm.tsx'
import { PayModal, type PayStatus } from '../components/payments/PayModal.tsx'
import { MemberList } from '../components/group/MemberList.tsx'
import { AddMembersModal } from '../components/group/AddMembersModal.tsx'
import { Confirmation } from '../components/shared/Confirmation.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { SectionCard } from '../components/shared/SectionCard.tsx'
import { PlusIcon } from '../components/shared/NavItems.tsx'
import { useBalance } from '../lib/contracts/hooks/useBalance.ts'
import { useExpenses } from '../lib/contracts/hooks/useExpenses.ts'
import { useExpenseDetail } from '../lib/contracts/hooks/useExpenseDetail.ts'
import { useGroup } from '../lib/contracts/hooks/useGroup.ts'
import { FheNotConfiguredError } from '../lib/contracts/actions/recordExpense.ts'
import { createExpenseFlow } from '../lib/services/createExpense.ts'
import { toast } from '../store/toast.ts'
import { useWallet } from '../hooks/useWallet.ts'
import { executePayAction } from '../lib/services/payExpenseShare.ts'
import {
  flagErrorMessage,
  reminderErrorMessage,
  sendExpenseReminder,
  submitExpenseFlag,
} from '../lib/services/expenseActions.ts'
import { formatHandle } from '../lib/utils/format.ts'
import type { GroupAction } from '../types/contracts.ts'

export function GroupDetail() {
  const { id: groupId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { address, chainId } = useWallet()
  const queryClient = useQueryClient()
  const group = useGroup(groupId)
  const balance = useBalance(groupId)
  const expenses = useExpenses(groupId)

  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [expenseFormStatus, setExpenseFormStatus] = useState<ExpenseFormStatus>('idle')
  const [expenseConfirmation, setExpenseConfirmation] = useState<{
    description: string
    memberCount: number
  } | null>(null)
  const [payAction, setPayAction] = useState<GroupAction | null>(null)
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [addMembersOpen, setAddMembersOpen] = useState(false)
  const [flagExpenseId, setFlagExpenseId] = useState<string | null>(null)
  const [flagSubmitting, setFlagSubmitting] = useState(false)
  const [flaggedExpenseIds, setFlaggedExpenseIds] = useState<string[]>([])
  const [remindingAddress, setRemindingAddress] = useState<string | null>(null)

  const expenseDetail = useExpenseDetail(groupId, selectedExpenseId)

  const isAdmin =
    Boolean(address) &&
    Boolean(group.group?.adminAddress) &&
    address!.toLowerCase() === group.group!.adminAddress.toLowerCase()

  useEffect(() => {
    const fromQuery = searchParams.get('expense')
    if (fromQuery) {
      setSelectedExpenseId(fromQuery)
      searchParams.delete('expense')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handlePay = async () => {
    if (!payAction) return

    try {
      await executePayAction({
        action: payAction,
        groupId,
        onPhase: (phase) => setPayStatus(phase),
      })
      await queryClient.invalidateQueries({ queryKey: ['balance'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
      if (payAction.expenseId) {
        await queryClient.invalidateQueries({
          queryKey: ['expense', groupId, payAction.expenseId],
        })
      }

      setPayStatus('success')
      toast.success('Payment sent. Share marked paid.')
    } catch (err) {
      setPayStatus('idle')
      const code = err instanceof Error ? err.message : ''
      if (code === 'payee_address_missing') {
        toast.error('Payee wallet address not found')
      } else if (code === 'payment_amount_invalid') {
        toast.error('Payment amount is invalid')
      } else if (code === 'tx_not_found') {
        toast.error('Payment sent but confirmation is delayed. Refresh in a moment.')
      } else if (code === 'tx_recipient_mismatch' || code === 'tx_sender_mismatch') {
        toast.error('Transaction did not match the expected payee.')
      } else if (code === 'unauthorized') {
        toast.error('Session expired. Sign in again, then retry.')
      } else if (code.startsWith('tx_')) {
        toast.error(`Payment verification failed (${code})`)
      } else {
        toast.error('Payment failed or was rejected')
      }
    }
  }

  const closePay = () => {
    setPayAction(null)
    setPayStatus('idle')
  }

  const handleRemind = async (expenseId: string, memberAddress: string, handle: string) => {
    setRemindingAddress(memberAddress)
    try {
      await sendExpenseReminder(groupId, expenseId, memberAddress)
      await queryClient.invalidateQueries({ queryKey: ['expense', groupId, expenseId] })
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(`Reminder sent to ${formatHandle(handle)}`)
    } catch (err) {
      toast.error(reminderErrorMessage(err))
    } finally {
      setRemindingAddress(null)
    }
  }

  const handleFlag = async (expenseId: string, reason: string) => {
    setFlagSubmitting(true)
    try {
      await submitExpenseFlag(groupId, expenseId, reason)
      await queryClient.invalidateQueries({ queryKey: ['expense', groupId, expenseId] })
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setFlaggedExpenseIds((ids) => [...ids, expenseId])
      setFlagExpenseId(null)
      toast.success('Flag submitted. Group admin notified.')
    } catch (err) {
      toast.error(flagErrorMessage(err))
    } finally {
      setFlagSubmitting(false)
    }
  }

  const handleAddExpense = async (split: ExpenseSplit) => {
    setExpenseFormStatus('encrypting')
    const memberCount = group.members.length

    try {
      if (!chainId || !group.group?.chainGroupId) {
        toast.error('Group is not linked on-chain yet')
        return
      }
      setExpenseFormStatus('confirming')
      await createExpenseFlow({
        chainId,
        groupId,
        chainGroupId: group.group.chainGroupId,
        split,
      })

      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setExpenseFormStatus('success')
      setExpenseFormOpen(false)
      setExpenseConfirmation({ description: split.description, memberCount })
      toast.success('Expense added')
    } catch (err) {
      if (err instanceof FheNotConfiguredError) {
        toast.error('FHE client required to add expenses on-chain')
      } else {
        toast.error('Could not add expense')
      }
    } finally {
      setExpenseFormStatus('idle')
    }
  }

  return (
    <div className="veil-page">
      <PageHeader
        title={group.group?.name ?? 'Group'}
        description={
          group.group?.description?.trim() ||
          (group.members.length > 0
            ? `${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}`
            : undefined)
        }
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/groups/${groupId}/settings`}
              className="veil-btn-secondary inline-flex items-center gap-2"
              aria-label="Group settings"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.53 1.53 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.53 1.53 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.53 1.53 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.53 1.53 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => setExpenseFormOpen(true)}
              className="veil-btn-primary"
            >
              Add expense
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <SectionCard
            title="Expenses"
            description={
              expenses.total > 0
                ? `${expenses.total} ${expenses.total === 1 ? 'expense' : 'expenses'}`
                : undefined
            }
          >
            <ExpenseFeed
              expenses={expenses.expenses}
              total={expenses.total}
              currentUserAddress={address}
              isLoading={expenses.isLoading}
              isError={expenses.isError}
              isEmpty={expenses.isEmpty}
              hasMore={expenses.hasMore}
              isLoadingMore={expenses.isLoadingMore}
              onLoadMore={expenses.loadMore}
              onSelect={setSelectedExpenseId}
              onFlag={(expenseId) => setFlagExpenseId(expenseId)}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Members"
            description={`${group.members.length} ${group.members.length === 1 ? 'person' : 'people'}`}
            action={
              isAdmin ? (
                <button
                  type="button"
                  onClick={() => setAddMembersOpen(true)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-raised hover:text-foreground"
                  aria-label="Add members"
                >
                  <PlusIcon className="size-4" />
                </button>
              ) : undefined
            }
          >
            <MemberList
              members={group.members}
              adminAddress={group.group?.adminAddress}
              currentUserAddress={address}
              isLoading={group.isLoading}
              isError={group.isError}
              isEmpty={group.isEmpty}
              settingsHref={`/groups/${groupId}/settings`}
            />
          </SectionCard>

          <SectionCard title="My actions">
            <MyActions
              actions={balance.myActions}
              isLoading={balance.isLoading}
              isError={balance.isError}
              isEmpty={balance.isEmpty}
              compactEmpty
              seeAllHref="/activity?tab=owe"
              onPay={(action) => {
                setPayAction(action)
                setPayStatus('idle')
              }}
            />
          </SectionCard>
        </div>
      </div>

      <PayModal
        action={payAction}
        status={payStatus}
        onClose={closePay}
        onPay={handlePay}
      />

      <ExpenseForm
        isOpen={expenseFormOpen}
        status={expenseFormStatus}
        members={group.members}
        onClose={() => setExpenseFormOpen(false)}
        onSubmit={(split) => {
          void handleAddExpense(split)
        }}
      />

      {group.group && (
        <AddMembersModal
          isOpen={addMembersOpen}
          groupId={groupId}
          groupName={group.group.name}
          inviteToken={group.group.inviteToken}
          members={group.members}
          chainGroupId={group.group.chainGroupId}
          chainId={chainId}
          onClose={() => setAddMembersOpen(false)}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['group', groupId] })
            queryClient.invalidateQueries({ queryKey: ['groups'] })
          }}
        />
      )}

      <ExpenseDetailSheet
        detail={expenseDetail.detail}
        isLoading={expenseDetail.isLoading}
        onClose={() => setSelectedExpenseId(null)}
        remindingAddress={remindingAddress}
        onRemind={
          selectedExpenseId
            ? (memberAddress, handle) => {
                void handleRemind(selectedExpenseId, memberAddress, handle)
              }
            : undefined
        }
      />

      <FlagExpenseModal
        expenseId={flagExpenseId}
        expenseDescription={
          flagExpenseId
            ? expenses.expenses.find((e) => e.id === flagExpenseId)?.description
            : undefined
        }
        alreadyFlagged={
          Boolean(
            flagExpenseId &&
              (flaggedExpenseIds.includes(flagExpenseId) ||
                (flagExpenseId === selectedExpenseId && expenseDetail.detail?.flaggedByYou)),
          )
        }
        isSubmitting={flagSubmitting}
        onClose={() => setFlagExpenseId(null)}
        onSubmit={(expenseId, reason) => {
          void handleFlag(expenseId, reason)
        }}
      />

      {expenseConfirmation && (
        <Confirmation
          title="Expense added"
          lines={[
            expenseConfirmation.description,
            `Split between ${expenseConfirmation.memberCount} members`,
          ]}
          primaryAction={{
            label: 'View in feed',
            onClick: () => setExpenseConfirmation(null),
          }}
          secondaryAction={{
            label: 'Add another',
            onClick: () => {
              setExpenseConfirmation(null)
              setExpenseFormOpen(true)
            },
          }}
        />
      )}
    </div>
  )
}
