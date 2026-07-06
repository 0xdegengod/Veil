import { useQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { useWallet } from '../../../hooks/useWallet.ts'
import type { DashboardSummary } from '../../../types/contracts.ts'
import { fetchDashboard as fetchDashboardApi } from '../../api/dashboard.ts'

const EMPTY: DashboardSummary = {
  totalYouOweCents: 0,
  totalOwedToYouCents: 0,
  netPositionCents: 0,
  pendingPayCount: 0,
  pendingReceiveCount: 0,
  recentActivity: [],
  creditsFromExpenses: [],
  payActions: [],
  balancesByGroup: [],
}

const FHE_STALE_MS = 5 * 60 * 1000

export function useDashboard() {
  const { address, chainId } = useWallet()
  const apiReady = useApiReady()

  const query = useQuery({
    queryKey: ['dashboard', address, chainId],
    queryFn: async (): Promise<DashboardSummary> =>
      fetchDashboardApi(chainId!, address!),
    enabled: apiReady && Boolean(address) && Boolean(chainId),
    staleTime: FHE_STALE_MS,
  })

  return {
    summary: query.data ?? EMPTY,
    isLoading: query.isLoading,
    isError: query.isError,
    isEmpty: !query.isLoading && (query.data?.balancesByGroup.length ?? 0) === 0,
  }
}
