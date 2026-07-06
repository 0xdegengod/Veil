import { useWallet } from './useWallet.ts'
import { useAuth } from './useAuth.ts'

/** True when the connected wallet has a valid SIWE session and profile (safe to call backend / FHE). */
export function useApiReady(): boolean {
  const { address, isConnected, chainId } = useWallet()
  const auth = useAuth(address, chainId)

  return isConnected && auth.isAuthenticated && auth.hasProfile
}
