import { useEffect, useState } from 'react'

export type Theme = 'auto' | 'light' | 'dark'
const KEY = 'tatva-theme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(KEY) as Theme) || 'auto'
    } catch {
      return 'auto'
    }
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])
  return [theme, setTheme]
}
