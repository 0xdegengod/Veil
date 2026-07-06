import { NavLink, Outlet } from 'react-router-dom'
import { useOnboardingStep } from '../onboarding/OnboardingSetup.tsx'
import { useNotificationUnreadCount } from '../../hooks/useNotifications.ts'
import { useDashboard } from '../../lib/contracts/hooks/useDashboard.ts'
import { unseenCount, useActivitySeenStore } from '../../store/activitySeen.ts'
import { AccountMenu } from './AccountMenu.tsx'
import { NetworkGuard } from './NetworkGuard.tsx'
import { BellIcon, NavIconItem, NavTextItem, PlusIcon } from './NavItems.tsx'
import { VeilLogo } from './VeilLogo.tsx'

export function AppShell() {
  const { isComplete } = useOnboardingStep()
  const unreadCount = useNotificationUnreadCount()
  const { summary } = useDashboard()
  const seenOweCount = useActivitySeenStore((s) => s.seenOweCount)
  const seenAwaitingCount = useActivitySeenStore((s) => s.seenAwaitingCount)

  const oweCount = summary.payActions.length
  const awaitingCount = summary.creditsFromExpenses.filter((c) => c.pendingCents > 0).length
  const activityCount =
    unseenCount(oweCount, seenOweCount) + unseenCount(awaitingCount, seenAwaitingCount)

  const navEnabled = isComplete

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <NavLink to="/dashboard" className="shrink-0">
            <VeilLogo size="sm" />
          </NavLink>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1">
            <NavTextItem to="/dashboard" enabled>
              Dashboard
            </NavTextItem>
            <NavTextItem to="/activity" enabled={navEnabled} badge={activityCount}>
              Activity
            </NavTextItem>
            <NavTextItem to="/groups" enabled={navEnabled}>
              Groups
            </NavTextItem>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {navEnabled ? (
              <NavLink
                to="/groups/new"
                className="veil-btn-primary inline-flex h-10 items-center gap-1.5 px-3 text-sm"
              >
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">New group</span>
              </NavLink>
            ) : (
              <span
                className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-xl bg-accent/40 px-3 text-sm font-medium text-white/70"
                title="Complete setup first"
              >
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">New group</span>
              </span>
            )}

            <NavIconItem
              to="/notifications"
              label="Notifications"
              enabled={navEnabled}
              badge={unreadCount}
            >
              <BellIcon />
            </NavIconItem>

            <AccountMenu setupComplete={navEnabled} />
          </div>
        </div>
      </header>

      <NetworkGuard>
        <main className="flex-1">
          <Outlet />
        </main>
      </NetworkGuard>
    </div>
  )
}
