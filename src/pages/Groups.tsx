import { GroupsSection } from '../components/dashboard/GroupsSection.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { useDashboard } from '../lib/contracts/hooks/useDashboard.ts'
import { useGroups } from '../lib/contracts/hooks/useGroups.ts'

export function Groups() {
  const groups = useGroups()
  const dashboard = useDashboard()

  return (
    <div className="veil-page">
      <PageHeader
        title="Your groups"
        description="All groups you belong to and your net balance in each."
      />

      {groups.isError && (
        <p className="text-sm text-negative">Unable to load groups.</p>
      )}

      <GroupsSection
        groups={groups.groups}
        balancesByGroup={dashboard.summary.balancesByGroup}
        isLoading={groups.isLoading || dashboard.isLoading}
      />
    </div>
  )
}
