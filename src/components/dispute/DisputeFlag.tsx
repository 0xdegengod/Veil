import { useState } from 'react'

type DisputeFlagProps = {
  expenseId: string
  onSubmit: (expenseId: string, reason: string) => void
}

export function DisputeFlag({ expenseId, onSubmit }: DisputeFlagProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form
      className="rounded-lg border border-border bg-surface p-4 text-left"
      onSubmit={(e) => {
        e.preventDefault()
        setIsSubmitting(true)
        onSubmit(expenseId, reason)
        setIsSubmitting(false)
        setReason('')
      }}
    >
      <h3 className="font-medium">Flag expense</h3>
      <p className="mt-1 text-sm text-locked">Submit an anonymous flag</p>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        disabled={isSubmitting}
        placeholder="Describe the issue"
        className="mt-3 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
        rows={3}
      />

      <button
        type="submit"
        disabled={isSubmitting || !reason}
        className="mt-3 w-full rounded-lg bg-accent px-4 py-2 text-sm hover:bg-accent-hover disabled:opacity-50"
      >
        Submit flag
      </button>
    </form>
  )
}
