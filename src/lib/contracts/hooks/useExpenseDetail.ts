import { useQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { useWallet } from '../../../hooks/useWallet.ts'
import { getExpenseDetailMeta, toExpenseDetail } from '../../api/expenses.ts'
import { getContractAddresses } from '../../contracts/addresses.ts'
import { resolveExpenseAmounts } from '../../fhe/expenseAmounts.ts'
import type { ExpenseDetail } from '../../../types/contracts.ts'

const FHE_STALE_MS = 5 * 60 * 1000

export function useExpenseDetail(groupId: string, expenseId: string | null) {
  const { address, chainId } = useWallet()
  const apiReady = useApiReady()

  const query = useQuery({
    queryKey: ['expense', groupId, expenseId, address, chainId],
    queryFn: async (): Promise<ExpenseDetail | null> => {
      if (!expenseId) return null

      const meta = await getExpenseDetailMeta(groupId, expenseId)
      const base = toExpenseDetail(meta)

      if (
        meta.viewerRole === 'observer' ||
        !meta.chainExpenseId ||
        !meta.chainGroupId ||
        !chainId ||
        !address
      ) {
        return base
      }

      const contracts = getContractAddresses(chainId)
      const ledger = contracts?.confidentialLedger
      if (!ledger || ledger === '0x0000000000000000000000000000000000000000') {
        return base
      }

      try {
        const repaidWallets = new Set(
          meta.participants
            .filter((p) => p.status === 'paid')
            .map((p) => p.walletAddress.toLowerCase()),
        )

        const amounts = await resolveExpenseAmounts(
          chainId,
          meta.chainExpenseId,
          ledger,
          meta.viewerRole,
          address,
          meta.payerAddress,
          meta.payerHandle,
          meta.participants,
          { repaidWallets },
        )
        return toExpenseDetail(meta, amounts)
      } catch {
        return base
      }
    },
    enabled: apiReady && Boolean(groupId) && Boolean(expenseId),
    staleTime: FHE_STALE_MS,
  })

  return {
    detail: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
