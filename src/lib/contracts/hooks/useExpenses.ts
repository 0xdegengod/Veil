import { useInfiniteQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { EXPENSE_PAGE_SIZE } from '../../constants/listLimits.ts'
import { listExpenses } from '../../api/expenses.ts'

export function useExpenses(groupId: string) {
  const apiReady = useApiReady()

  const query = useInfiniteQuery({
    queryKey: ['expenses', groupId],
    queryFn: ({ pageParam = 0 }) =>
      listExpenses(groupId, { limit: EXPENSE_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.items.length
      return next < lastPage.total ? next : undefined
    },
    enabled: apiReady && Boolean(groupId),
  })

  const expenses = query.data?.pages.flatMap((p) => p.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return {
    expenses,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && total === 0,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  }
}
