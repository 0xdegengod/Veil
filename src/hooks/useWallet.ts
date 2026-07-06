import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function useWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  return {
    address,
    isConnected,
    chainId,
    connect,
    connectors,
    isConnecting,
    disconnect,
  }
}
