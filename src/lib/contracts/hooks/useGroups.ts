import { useQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { listGroups } from '../../api/groups.ts'

export function useGroups() {
  const apiReady = useApiReady()

  const query = useQuery({
    queryKey: ['groups'],
    queryFn: () => listGroups(),
    enabled: apiReady,
  })

  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && (query.data?.length ?? 0) === 0,
  }
}
