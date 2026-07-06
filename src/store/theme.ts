import { create } from 'zustand'
import { THEME_STORAGE_KEY } from '../lib/constants/app.ts'

export type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

export function getInitialTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function hydrateTheme(): Theme {
  const theme = getInitialTheme()
  applyTheme(theme)
  return theme
}

type ThemeStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

export function initThemeStore() {
  const theme = hydrateTheme()
  useThemeStore.setState({ theme })
}
