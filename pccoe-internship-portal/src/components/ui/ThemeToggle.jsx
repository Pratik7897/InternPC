import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full transition-colors duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 group"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun 
        className={`absolute w-5 h-5 transition-all duration-500 ease-in-out ${
          isDark ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100 text-amber-500 group-hover:text-amber-600'
        }`} 
      />
      <Moon 
        className={`absolute w-5 h-5 transition-all duration-500 ease-in-out ${
          isDark ? 'rotate-0 opacity-100 scale-100 text-blue-400 group-hover:text-blue-300' : 'rotate-90 opacity-0 scale-50'
        }`} 
      />
      
      {/* Optional minimal subtle background glow effect */}
      <span className="absolute inset-0 rounded-full bg-current opacity-0 transition-opacity duration-300 group-hover:opacity-5"></span>
    </button>
  )
}
