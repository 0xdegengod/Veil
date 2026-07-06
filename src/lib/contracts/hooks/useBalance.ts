import { useQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { useWallet } from '../../../hooks/useWallet.ts'
import { getGroup } from '../../api/groups.ts'
import { listGroupExpenseDebts } from '../../api/dashboard.ts'
import { readBalanceHandles } from '../../contracts/readLedger.ts'
import { isLedgerReady } from '../../contracts/addresses.ts'
import { resolveExpenseDebtPayActions } from '../../fhe/resolveDebtPayActions.ts'
import { sortByLatest } from '../../utils/sort.ts'
import type { GroupAction } from '../../../types/contracts.ts'

const FHE_STALE_MS = 5 * 60 * 1000

type BalanceData = {
  myBalanceHandle: unknown
  myActions: GroupAction[]
  netBalanceCents: number
}

async function fetchBalance(
  groupId: string,
  chainId: number,
  address: `0x${string}`,
): Promise<BalanceData> {
  const [{ group }, debtMeta] = await Promise.all([
    getGroup(groupId),
    listGroupExpenseDebts(groupId),
  ])

  const chainGroupId = group.chainGroupId
  let myBalanceHandle: unknown = null

  if (chainGroupId && isLedgerReady(chainId)) {
    myBalanceHandle = await readBalanceHandles(chainId, chainGroupId, address)
  }

  const debtActions = await resolveExpenseDebtPayActions(chainId, address, debtMeta)

  return {
    myBalanceHandle,
    myActions: sortByLatest(debtActions),
    netBalanceCents: 0,
  }
}

export function useBalance(groupId: string) {
  const { address, chainId } = useWallet()
  const apiReady = useApiReady()

  const query = useQuery({
    queryKey: ['balance', groupId, address, chainId],
    queryFn: async (): Promise<BalanceData> =>
      fetchBalance(groupId, chainId!, address!),
    enabled:
      apiReady &&
      Boolean(groupId) &&
      Boolean(address) &&
      Boolean(chainId) &&
      isLedgerReady(chainId ?? 0),
    staleTime: FHE_STALE_MS,
  })

  return {
    myBalanceHandle: query.data?.myBalanceHandle,
    myActions: query.data?.myActions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && !query.data?.myActions.length,
  }
}
