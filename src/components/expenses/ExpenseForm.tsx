import { useEffect, useMemo, useState } from 'react'
import type { Member } from '../../types/contracts.ts'
import { formatAmount, formatHandle } from '../../lib/utils/format.ts'
import { CENT_MULTIPLIER } from '../../lib/constants/app.ts'

export type ExpenseFormStatus =
  | 'idle'
  | 'encrypting'
  | 'confirming'
  | 'processing'
  | 'success'

export type ExpenseSplit = {
  description: string
  amountCents: number
  splitMode: 'even' | 'custom'
  shares: { address: string; handle: string; amountCents: number }[]
}

type ExpenseFormProps = {
  isOpen: boolean
  status: ExpenseFormStatus
  members: Member[]
  onClose: () => void
  onSubmit: (split: ExpenseSplit) => void
}

export function ExpenseForm({
  isOpen,
  status,
  members,
  onClose,
  onSubmit,
}: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitMode, setSplitMode] = useState<'even' | 'custom'>('even')
  const [customShares, setCustomShares] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setDescription('')
      setAmount('')
      setSplitMode('even')
      setCustomShares({})
    }
  }, [isOpen])

  const totalCents = Math.round((Number(amount) || 0) * CENT_MULTIPLIER)

  const evenShareCents = members.length
    ? Math.round(totalCents / members.length)
    : 0

  const customTotalCents = useMemo(
    () =>
      members.reduce((sum, m) => {
        const val = Number(customShares[m.address]) || 0
        return sum + Math.round(val * CENT_MULTIPLIER)
      }, 0),
    [customShares, members],
  )

  if (!isOpen) return null

  const isBusy = status !== 'idle' && status !== 'success'
  const remainingCents = totalCents - customTotalCents
  const customBalanced = splitMode === 'even' || remainingCents === 0
  const canSubmit =
    description.trim().length > 0 && totalCents > 0 && customBalanced && !isBusy

  const buildShares = () =>
    members.map((m, index) => {
      if (splitMode === 'even') {
        const isLast = index === members.length - 1
        const amountCents = isLast
          ? totalCents - evenShareCents * (members.length - 1)
          : evenShareCents
        return { address: m.address, handle: m.handle, amountCents }
      }
      return {
        address: m.address,
        handle: m.handle,
        amountCents: Math.round((Number(customShares[m.address]) || 0) * CENT_MULTIPLIER),
      }
    })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-4">
      <form
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-raised p-6 lg:rounded-2xl"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({
            description: description.trim(),
            amountCents: totalCents,
            splitMode,
            shares: buildShares(),
          })
        }}
      >
        <h2 className="mb-4 text-lg font-medium text-foreground">Add expense</h2>

        <label className="mb-3 block text-left text-sm text-foreground">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isBusy}
            placeholder="Dinner, groceries…"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>

        <label className="mb-4 block text-left text-sm text-foreground">
          Total amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            required
            disabled={isBusy}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono tabular-nums"
          />
        </label>

        <div className="mb-3 inline-flex rounded-lg border border-border p-1">
          {(['even', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={isBusy}
              onClick={() => setSplitMode(mode)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                splitMode === mode
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {mode} split
            </button>
          ))}
        </div>

        {splitMode === 'even' ? (
          <div className="mb-4 rounded-lg border border-border-subtle bg-surface/60 p-3">
            <p className="text-sm text-muted">
              Split evenly between {members.length}{' '}
              {members.length === 1 ? 'person' : 'people'}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
              {formatAmount(evenShareCents)} each
            </p>
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            {members.map((m) => (
              <div key={m.address} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-foreground">
                  {m.handle === 'you' ? 'You' : formatHandle(m.handle)}
                </span>
                <input
                  value={customShares[m.address] ?? ''}
                  onChange={(e) =>
                    setCustomShares((prev) => ({ ...prev, [m.address]: e.target.value }))
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isBusy}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono tabular-nums"
                />
              </div>
            ))}
            <p
              className={`text-right text-xs tabular-nums ${
                remainingCents === 0 ? 'text-positive' : 'text-muted'
              }`}
            >
              {remainingCents === 0
                ? 'Fully allocated'
                : `${formatAmount(Math.abs(remainingCents))} ${remainingCents > 0 ? 'left' : 'over'}`}
            </p>
          </div>
        )}

        {status === 'encrypting' && (
          <p className="mb-4 text-sm text-locked">Encrypting amounts…</p>
        )}
        {status === 'confirming' && (
          <p className="mb-4 text-sm text-locked">Confirm in wallet…</p>
        )}
        {status === 'processing' && (
          <p className="mb-4 text-sm text-muted">Processing…</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="veil-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="veil-btn-primary flex-1 disabled:opacity-50"
          >
            Add expense
          </button>
        </div>
      </form>
    </div>
  )
}
