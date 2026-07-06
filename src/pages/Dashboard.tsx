import { DashboardActivity } from '../components/dashboard/DashboardActivity.tsx'
import { DashboardOverview } from '../components/dashboard/DashboardOverview.tsx'
import { OnboardingSetup, useOnboardingStep } from '../components/onboarding/OnboardingSetup.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { useDashboard } from '../lib/contracts/hooks/useDashboard.ts'
import { useGroups } from '../lib/contracts/hooks/useGroups.ts'

export function Dashboard() {
  const { isComplete, isLoading: setupLoading } = useOnboardingStep()
  const groups = useGroups()
  const dashboard = useDashboard()

  if (setupLoading) {
    return (
      <div className="veil-page flex min-h-[40vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (!isComplete) {
    return (
      <div className="veil-page">
        <OnboardingSetup />
      </div>
    )
  }

  const showEmpty =
    !groups.isLoading && !groups.isError && groups.isEmpty && !dashboard.isLoading

  return (
    <div className="veil-page">
      <PageHeader
        title="Dashboard"
        description="Balances, activity, and groups in one place."
      />

      {showEmpty && (
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-surface to-surface p-8 sm:p-12">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-9a4.5 4.5 0 014.5 4.5M12 8a4.5 4.5 0 00-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Split expenses, keep amounts private
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Create a group from the header, add friends by handle, and track who owes what
              with every amount encrypted end-to-end on-chain.
            </p>
          </div>
        </div>
      )}

      {!showEmpty && (
        <div className="space-y-6">
          <DashboardOverview summary={dashboard.summary} isLoading={dashboard.isLoading} />

          <DashboardActivity
            summary={dashboard.summary}
            isLoading={dashboard.isLoading}
            groups={groups.groups}
            groupsLoading={groups.isLoading}
            balancesByGroup={dashboard.summary.balancesByGroup}
          />

          {groups.isError && (
            <p className="text-sm text-negative">Unable to load groups.</p>
          )}
        </div>
      )}
    </div>
  )
}
