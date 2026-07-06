import { useThemeStore } from '../../store/theme.ts'
import { MoonIcon, NavActionButton, SunIcon } from './NavItems.tsx'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <NavActionButton label={label} onClick={toggleTheme}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </NavActionButton>
  )
}
