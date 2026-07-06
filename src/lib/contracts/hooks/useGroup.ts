import { useQuery } from '@tanstack/react-query'
import { useApiReady } from '../../../hooks/useApiReady.ts'
import { getGroup } from '../../api/groups.ts'

export function useGroup(groupId: string) {
  const apiReady = useApiReady()

  const query = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroup(groupId),
    enabled: apiReady && Boolean(groupId),
  })

  return {
    group: query.data?.group,
    members: query.data?.members ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && !query.data?.members.length,
  }
}
