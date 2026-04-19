import { Link } from 'react-router-dom'
import { Bell, User } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'
import { useThemeStore } from '../../store/themeStore'

export default function Header({ userRole = 'student' }) {
  const { theme } = useThemeStore()

  return (
    <header className="h-16 border-b glass flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-4 md:hidden">
        <img 
          src="/logo.png" 
          alt="PCCOE Logo" 
          className="h-8 object-contain" 
        />
      </div>
      
      <div className="hidden md:block"></div>

      <div className="flex items-center gap-3 text-text-secondary">
        <ThemeToggle />
        <Link to={`/${userRole}/notifications`} className="p-2 hover:bg-accent-blue/10 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-blue rounded-full"></span>
        </Link>
        <div className="flex items-center gap-3 border-l pl-3 transition-colors duration-300">
          <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="text-text-primary font-medium leading-none">User</p>
            <p className="text-xs mt-1 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
