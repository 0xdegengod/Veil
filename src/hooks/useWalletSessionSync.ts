import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { fetchAuthMe } from '../lib/auth/siwe.ts'
import { getSessionToken, subscribeSession } from '../lib/auth/session.ts'
import { signOut } from '../lib/auth/siwe.ts'
import { clearDecryptSession } from '../lib/fhe/userDecrypt.ts'

/**
 * Clears SIWE session when the connected wallet changes or disconnects.
 * Mount once at the app root so Rabby/MetaMask account switches are handled everywhere.
 */
export function useWalletSessionSync() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const prevAddress = useRef<string | undefined>(address)
  const [, bumpSession] = useState(0)

  useEffect(() => subscribeSession(() => bumpSession((n) => n + 1)), [])

  const token = getSessionToken()

  const logout = useCallback(() => {
    clearDecryptSession()
    signOut()
    queryClient.clear()
  }, [queryClient])

  useLayoutEffect(() => {
    if (!isConnected || !address) {
      if (token) logout()
      prevAddress.current = undefined
      return
    }

    if (prevAddress.current && prevAddress.current.toLowerCase() !== address.toLowerCase()) {
      logout()
    }

    prevAddress.current = address
  }, [address, isConnected, token, logout])

  useEffect(() => {
    if (!token || !address) return

    let cancelled = false
    void fetchAuthMe()
      .then((session) => {
        if (cancelled) return
        if (session.walletAddress.toLowerCase() !== address.toLowerCase()) {
          logout()
        }
      })
      .catch(() => {
        if (!cancelled) logout()
      })

    return () => {
      cancelled = true
    }
  }, [address, token, logout])
}
