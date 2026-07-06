import { useSwitchChain } from 'wagmi'
import { SEPOLIA_CHAIN_ID } from '../../lib/constants/app.ts'
import { useWallet } from '../../hooks/useWallet.ts'

type NetworkGuardProps = {
  children: React.ReactNode
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected, chainId } = useWallet()
  const { switchChain } = useSwitchChain()
  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID

  if (!isWrongNetwork) return <>{children}</>

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-surface-raised px-4 py-3 text-sm">
        <span>Switch to Sepolia to continue</span>
        <button
          type="button"
          onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
          className="rounded-lg bg-accent px-4 py-2 hover:bg-accent-hover"
        >
          Switch network
        </button>
      </div>
      <div className="pt-14">{children}</div>
    </>
  )
}
