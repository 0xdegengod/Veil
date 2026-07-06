import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useOnboardingStep } from '../onboarding/OnboardingSetup.tsx'

/** Blocks app routes until wallet sign-in and profile are complete. Dashboard always allowed. */
export function SetupGate() {
  const location = useLocation()
  const { isComplete } = useOnboardingStep()

  if (!isComplete && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
