import { create } from 'zustand'

const THEME_KEY = 'theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark'
  
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  
  return 'dark'
}

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  
  initializeTheme: () => {
    const theme = get().theme
    applyTheme(theme)
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, newTheme)
    applyTheme(newTheme)
    set({ theme: newTheme })
  },

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    set({ theme })
  }
}))
