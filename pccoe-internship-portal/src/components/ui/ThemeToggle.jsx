import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-gradient-to-r from-[#1e293b] to-[#334155] dark:from-[#1e293b] dark:to-[#334155] transition-all duration-300 hover:shadow-lg hover:shadow-accent-blue/20 group"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ${isDark ? 'translate-x-0' : 'translate-x-7'}`}>
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-accent-blue" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-accent-gold" />
          )}
        </div>
      </div>
      
      <div 
        className={`
          absolute top-0.5 w-6 h-6 rounded-full 
          bg-gradient-to-br from-white to-slate-100
          dark:from-accent-blue/20 dark:to-accent-blue/10
          shadow-md transition-all duration-300 ease-out
          ${isDark ? 'left-0.5' : 'left-7.5'}
          group-hover:scale-110
        `}
      />
    </button>
  )
}
