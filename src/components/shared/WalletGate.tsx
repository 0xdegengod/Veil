import { Navigate, Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'

/** Redirects to dashboard when wallet is not connected (except dashboard itself). */
export function WalletGate() {
  const { isConnected, isConnecting } = useAccount()

  if (isConnecting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (!isConnected) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
