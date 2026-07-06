import { create } from 'zustand'

type ActivitySeenStore = {
  seenOweCount: number
  seenAwaitingCount: number
  markOweSeen: (count: number) => void
  markAwaitingSeen: (count: number) => void
}

export function unseenCount(current: number, seen: number): number {
  return Math.max(0, current - seen)
}

export const useActivitySeenStore = create<ActivitySeenStore>((set) => ({
  seenOweCount: 0,
  seenAwaitingCount: 0,

  markOweSeen: (count) => set({ seenOweCount: count }),
  markAwaitingSeen: (count) => set({ seenAwaitingCount: count }),
}))
