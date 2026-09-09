import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
    if (window.electronAPI) {
      window.electronAPI.setTheme(theme).catch(console.error)
    }
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  }
}))
