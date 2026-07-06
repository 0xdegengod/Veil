import { Link } from 'react-router-dom'
import type { DashboardSummary, Group } from '../../types/contracts.ts'
import { DASHBOARD_PREVIEW_LIMIT } from '../../lib/constants/listLimits.ts'
import {
  CreditsList,
  PayActionList,
  RecentActivityList,
} from '../activity/ActivityLists.tsx'
import { GroupsSection } from './GroupsSection.tsx'
import { SectionCard } from '../shared/SectionCard.tsx'

function SeeAllLink({ to, total }: { to: string; total: number }) {
  if (total <= DASHBOARD_PREVIEW_LIMIT) return null
  return (
    <Link to={to} className="text-sm text-accent hover:underline">
      See all
    </Link>
  )
}

type DashboardActivityProps = {
  summary: DashboardSummary
  isLoading: boolean
  groups: Group[]
  groupsLoading: boolean
  balancesByGroup: { groupId: string; groupName: string; netCents: number }[]
}

export function DashboardActivity({
  summary,
  isLoading,
  groups,
  groupsLoading,
  balancesByGroup,
}: DashboardActivityProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          title="You owe"
          description="Expense shares across groups"
          action={
            <SeeAllLink to="/activity?tab=owe" total={summary.payActions.length} />
          }
        >
          <PayActionList
            actions={summary.payActions}
            isLoading={isLoading}
            limit={DASHBOARD_PREVIEW_LIMIT}
          />
        </SectionCard>

        <SectionCard
          title="Awaiting from others"
          description="Expenses you paid. Outstanding repayments."
          action={
            <SeeAllLink
              to="/activity?tab=awaiting"
              total={summary.creditsFromExpenses.length}
            />
          }
        >
          <CreditsList
            credits={summary.creditsFromExpenses}
            isLoading={isLoading}
            limit={DASHBOARD_PREVIEW_LIMIT}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          title="Recent activity"
          description="Latest expenses across your groups"
          action={
            <SeeAllLink to="/activity?tab=recent" total={summary.recentActivity.length} />
          }
        >
          <RecentActivityList
            activity={summary.recentActivity}
            isLoading={isLoading}
            limit={DASHBOARD_PREVIEW_LIMIT}
          />
        </SectionCard>

        <GroupsSection
          groups={groups}
          balancesByGroup={balancesByGroup}
          isLoading={groupsLoading || isLoading}
          embedded
          limit={DASHBOARD_PREVIEW_LIMIT}
        />
      </div>
    </div>
  )
}
