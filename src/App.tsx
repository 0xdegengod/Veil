import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/shared/AppShell.tsx'
import { SetupGate } from './components/shared/SetupGate.tsx'
import { WalletGate } from './components/shared/WalletGate.tsx'
import { Toaster } from './components/shared/Toaster.tsx'
import { useWalletSessionSync } from './hooks/useWalletSessionSync.ts'
import { Landing } from './pages/Landing.tsx'

const InvitePage = lazy(() => import('./pages/InvitePage.tsx').then((m) => ({ default: m.InvitePage })))
const Activity = lazy(() => import('./pages/Activity.tsx').then((m) => ({ default: m.Activity })))
const Dashboard = lazy(() => import('./pages/Dashboard.tsx').then((m) => ({ default: m.Dashboard })))
const Groups = lazy(() => import('./pages/Groups.tsx').then((m) => ({ default: m.Groups })))
const NewGroup = lazy(() => import('./pages/NewGroup.tsx').then((m) => ({ default: m.NewGroup })))
const GroupDetail = lazy(() => import('./pages/GroupDetail.tsx').then((m) => ({ default: m.GroupDetail })))
const GroupSettings = lazy(() => import('./pages/GroupSettings.tsx').then((m) => ({ default: m.GroupSettings })))
const Profile = lazy(() => import('./pages/Profile.tsx').then((m) => ({ default: m.Profile })))
const Notifications = lazy(() => import('./pages/Notifications.tsx').then((m) => ({ default: m.Notifications })))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  )
}

export default function App() {
  useWalletSessionSync()

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route element={<WalletGate />}>
              <Route element={<SetupGate />}>
                <Route path="/activity" element={<Activity />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/new" element={<NewGroup />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/groups/:id/settings" element={<GroupSettings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}
