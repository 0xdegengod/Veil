import { useCallback, useEffect, useState } from 'react'

/** Client-side "load more" for lists already fetched in full. */
export function useVisibleCount(total: number, pageSize: number) {
  const [visible, setVisible] = useState(pageSize)

  useEffect(() => {
    setVisible(pageSize)
  }, [total, pageSize])

  const showing = Math.min(visible, total)

  return {
    showing,
    total,
    hasMore: showing < total,
    loadMore: useCallback(() => setVisible((v) => v + pageSize), [pageSize]),
  }
}
