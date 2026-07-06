import { useQuery } from '@tanstack/react-query'
import type { TrustTier } from '../../../types/contracts.ts'

type TrustScoreData = {
  tier: TrustTier
  score: number
}

async function fetchTrustScore(_address: string): Promise<TrustScoreData> {
  return {
    tier: 'medium',
    score: 0,
  }
}

export function useTrustScore(address: string | undefined) {
  const query = useQuery({
    queryKey: ['trustScore', address],
    queryFn: () => fetchTrustScore(address!),
    enabled: Boolean(address),
  })

  return {
    tier: query.data?.tier,
    score: query.data?.score,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
