import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastStore = {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 4000

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, variant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/** Imperative helper for use outside React components. */
export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, 'success'),
  error: (message: string) => useToastStore.getState().addToast(message, 'error'),
  info: (message: string) => useToastStore.getState().addToast(message, 'info'),
}
