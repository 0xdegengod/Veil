import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActivitySegment, ACTIVITY_TABS, type ActivityTab } from '../components/activity/ActivitySegment.tsx'
import {
  CreditsList,
  PayActionList,
  RecentActivityList,
} from '../components/activity/ActivityLists.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { SectionCard } from '../components/shared/SectionCard.tsx'
import { useDashboard } from '../lib/contracts/hooks/useDashboard.ts'
import { unseenCount, useActivitySeenStore } from '../store/activitySeen.ts'

const VALID_TABS = new Set<ActivityTab>(ACTIVITY_TABS.map((t) => t.id))

function parseTab(raw: string | null): ActivityTab {
  if (raw === 'all') return 'recent'
  if (raw && VALID_TABS.has(raw as ActivityTab)) return raw as ActivityTab
  return 'recent'
}

function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

type SectionProps = {
  title: string
  description: string
  children: ReactNode
}

function ActivitySection({ title, description, children }: SectionProps) {
  return (
    <SectionCard title={title} description={description}>
      {children}
    </SectionCard>
  )
}

export function Activity() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))
  const { summary, isLoading } = useDashboard()
  const seenOweCount = useActivitySeenStore((s) => s.seenOweCount)
  const seenAwaitingCount = useActivitySeenStore((s) => s.seenAwaitingCount)
  const markOweSeen = useActivitySeenStore((s) => s.markOweSeen)
  const markAwaitingSeen = useActivitySeenStore((s) => s.markAwaitingSeen)

  const oweCount = summary.payActions.length
  const awaitingCount = summary.creditsFromExpenses.filter((c) => c.pendingCents > 0).length
  const recentCount = summary.recentActivity.length

  const counts = useMemo(
    () => ({
      owe: unseenCount(oweCount, seenOweCount),
      awaiting: unseenCount(awaitingCount, seenAwaitingCount),
    }),
    [oweCount, awaitingCount, seenOweCount, seenAwaitingCount],
  )

  useEffect(() => {
    if (tab === 'owe') markOweSeen(oweCount)
    if (tab === 'awaiting') markAwaitingSeen(awaitingCount)
  }, [tab, oweCount, awaitingCount, markOweSeen, markAwaitingSeen])

  const setTab = (next: ActivityTab) => {
    if (next === 'recent') {
      searchParams.delete('tab')
    } else {
      searchParams.set('tab', next)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const activeMeta = ACTIVITY_TABS.find((t) => t.id === tab) ?? ACTIVITY_TABS[0]

  const showRecent = tab === 'recent'
  const showOwe = tab === 'owe'
  const showAwaiting = tab === 'awaiting'

  return (
    <div className="veil-page">
      <PageHeader
        title="Activity"
        description="Repayments and expenses across all your groups."
      />

      <div className="mb-6">
        <ActivitySegment active={tab} counts={counts} onChange={setTab} />
        <p className="mt-3 text-sm text-muted">{activeMeta.description}</p>
      </div>

      <div className="space-y-6">
        {showRecent && (
          <ActivitySection
            title="Recent expenses"
            description={countLabel(recentCount, 'event', 'events')}
          >
            <RecentActivityList activity={summary.recentActivity} isLoading={isLoading} />
          </ActivitySection>
        )}

        {showOwe && (
          <ActivitySection
            title="You owe"
            description={countLabel(oweCount, 'pending share', 'pending shares')}
          >
            <PayActionList actions={summary.payActions} isLoading={isLoading} />
          </ActivitySection>
        )}

        {showAwaiting && (
          <ActivitySection
            title="Awaiting from others"
            description={countLabel(awaitingCount, 'outstanding expense', 'outstanding expenses')}
          >
            <CreditsList credits={summary.creditsFromExpenses} isLoading={isLoading} />
          </ActivitySection>
        )}
      </div>
    </div>
  )
}
