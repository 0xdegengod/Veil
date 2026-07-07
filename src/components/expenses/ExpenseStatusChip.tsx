type ExpenseStatusChipProps = {
  status: 'pending' | 'paid' | 'all_paid'
}

export function ExpenseStatusChip({ status }: ExpenseStatusChipProps) {
  if (status === 'paid' || status === 'all_paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-medium text-positive">
        <span className="size-1.5 rounded-full bg-positive" />
        {status === 'all_paid' ? 'All paid' : 'Paid'}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-negative/15 px-2 py-0.5 text-[10px] font-medium text-negative">
      <span className="size-1.5 rounded-full bg-negative" />
      Unpaid
    </span>
  )
}
