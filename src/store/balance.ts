import { create } from 'zustand'
import { BALANCE_AUTO_LOCK_MS } from '../lib/constants/app.ts'

type RevealedBalance = {
  amountCents: number
  revealedAt: number
  lockTimerId: ReturnType<typeof setTimeout> | null
}

type BalanceStore = {
  revealed: RevealedBalance | null
  countdownSeconds: number
  reveal: (amountCents: number) => void
  lock: () => void
  tickCountdown: () => void
}

export const useBalanceStore = create<BalanceStore>((set, get) => ({
  revealed: null,
  countdownSeconds: 0,

  reveal: (amountCents) => {
    const existing = get().revealed
    if (existing?.lockTimerId) clearTimeout(existing.lockTimerId)

    const lockTimerId = setTimeout(() => {
      get().lock()
    }, BALANCE_AUTO_LOCK_MS)

    set({
      revealed: { amountCents, revealedAt: Date.now(), lockTimerId },
      countdownSeconds: BALANCE_AUTO_LOCK_MS / 1000,
    })
  },

  lock: () => {
    const existing = get().revealed
    if (existing?.lockTimerId) clearTimeout(existing.lockTimerId)
    set({ revealed: null, countdownSeconds: 0 })
  },

  tickCountdown: () => {
    const { revealed } = get()
    if (!revealed) return
    const elapsed = Math.floor((Date.now() - revealed.revealedAt) / 1000)
    const remaining = Math.max(0, BALANCE_AUTO_LOCK_MS / 1000 - elapsed)
    set({ countdownSeconds: remaining })
    if (remaining === 0) get().lock()
  },
}))
