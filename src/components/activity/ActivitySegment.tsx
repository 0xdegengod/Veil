export type ActivityTab = 'recent' | 'owe' | 'awaiting'

export const ACTIVITY_TABS: {
  id: ActivityTab
  label: string
  description: string
}[] = [
  { id: 'recent', label: 'Recent', description: 'Latest expenses across groups' },
  { id: 'owe', label: 'You owe', description: 'Expense shares you need to pay' },
  { id: 'awaiting', label: 'Awaiting', description: 'Expense repayments still outstanding' },
]

type ActivitySegmentProps = {
  active: ActivityTab
  counts: Partial<Record<ActivityTab, number>>
  onChange: (tab: ActivityTab) => void
}

export function ActivitySegment({ active, counts, onChange }: ActivitySegmentProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-border bg-surface/60 p-1 sm:min-w-0">
        {ACTIVITY_TABS.map((tab) => {
          const count = counts[tab.id]
          const isActive = active === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-accent font-medium text-white shadow-sm'
                  : 'text-muted hover:bg-surface-raised/60 hover:text-foreground'
              }`}
            >
              {tab.label}
              {count != null && count > 0 && tab.id !== 'recent' && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-accent/15 text-accent'
                  }`}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
