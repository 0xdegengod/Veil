import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSignMessage } from 'wagmi'
import { fetchAuthMe, saveProfile, signOut, verifySiwe } from '../lib/auth/siwe.ts'
import { getSessionToken, subscribeSession } from '../lib/auth/session.ts'
import type { Profile } from '../types/api.ts'

type AuthMeResponse = {
  walletAddress: string
  hasProfile: boolean
  profile: Profile | null
}

export function useAuth(address: string | undefined, chainId: number | undefined) {
  const queryClient = useQueryClient()
  const { signMessageAsync } = useSignMessage()
  const [, bumpSession] = useState(0)
  const token = getSessionToken()

  useEffect(() => subscribeSession(() => bumpSession((n) => n + 1)), [])

  const sessionQuery = useQuery({
    queryKey: ['auth', 'me', token, address?.toLowerCase()],
    queryFn: fetchAuthMe,
    enabled: Boolean(token) && Boolean(address),
    retry: false,
  })

  useEffect(() => {
    if (sessionQuery.isError) {
      signOut()
      queryClient.clear()
    }
  }, [sessionQuery.isError, queryClient])

  const signIn = useCallback(async () => {
    if (!address) throw new Error('wallet_required')
    const result = await verifySiwe(address, chainId ?? 11155111, signMessageAsync)
    const walletKey = address.toLowerCase()
    queryClient.setQueryData(['auth', 'me', result.token, walletKey], result)
    await queryClient.invalidateQueries({ queryKey: ['groups'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    return result
  }, [address, chainId, signMessageAsync, queryClient])

  const completeProfile = useCallback(
    async (input: { displayName: string; handle: string }) => {
      const profile = await saveProfile(input)
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      return profile
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    signOut()
    queryClient.clear()
  }, [queryClient])

  const session = sessionQuery.data as AuthMeResponse | undefined
  const profile: Profile | null = session?.profile ?? null
  const sessionWallet = session?.walletAddress
  const sessionMatchesWallet = Boolean(
    address &&
      sessionWallet &&
      sessionWallet.toLowerCase() === address.toLowerCase(),
  )
  const isAuthenticated = Boolean(token && sessionQuery.isSuccess && sessionMatchesWallet)
  const hasProfile = Boolean(session?.hasProfile)

  useEffect(() => {
    if (!token || !address || sessionQuery.isLoading || !sessionWallet) return
    if (!sessionMatchesWallet) {
      signOut()
      queryClient.clear()
    }
  }, [
    token,
    address,
    sessionWallet,
    sessionMatchesWallet,
    sessionQuery.isLoading,
    queryClient,
  ])

  return {
    token,
    profile,
    sessionWallet,
    isAuthenticated,
    hasProfile,
    isLoading: Boolean(token) && sessionQuery.isLoading,
    signIn,
    completeProfile,
    logout,
  }
}
