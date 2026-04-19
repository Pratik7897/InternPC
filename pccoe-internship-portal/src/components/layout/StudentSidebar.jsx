import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, UploadCloud, Briefcase, FileText, Bell, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useThemeStore } from '../../store/themeStore'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'My Profile', icon: User, path: '/student/profile' },
  { label: 'Upload Documents', icon: UploadCloud, path: '/student/upload' },
  { label: 'Browse Internships', icon: Briefcase, path: '/student/internships' },
  { label: 'My Applications', icon: FileText, path: '/student/applications' },
  { label: 'Notifications', icon: Bell, path: '/student/notifications' },
]

export default function StudentSidebar() {
  const { signOut, user, profileCompletion, setProfileCompletion } = useAuthStore()
  const { theme } = useThemeStore()
  const [hasUnread, setHasUnread] = useState(false)

  // Real-time profile completion sync
  useEffect(() => {
    if (!user) return

    const fetchCompletion = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('profile_completion')
        .eq('id', user.id)
        .maybeSingle()
      if (data?.profile_completion != null) {
        setProfileCompletion(data.profile_completion)
      }
    }
    fetchCompletion()

    const channel = supabase
      .channel(`profile-completion-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.profile_completion != null) {
            setProfileCompletion(payload.new.profile_completion)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, setProfileCompletion])

  // Smart notifications badge logic
  useEffect(() => {
    if (!user) return
    const checkNotifications = async () => {
      const profileAbandoned = localStorage.getItem('profile_form_started')
      const appAbandoned = localStorage.getItem('internship_app_started')
      const readIds = new Set(JSON.parse(localStorage.getItem('read_notification_ids') || '[]'))
      
      if ((profileAbandoned && !readIds.has('smart-abandoned-form')) || 
          (appAbandoned && !readIds.has('smart-abandoned-app'))) {
        setHasUnread(true)
        return
      }

      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', user.id)
        .limit(1)

      if ((!data || data.length === 0) && !readIds.has('smart-no-applications')) {
        setHasUnread(true)
      } else {
        setHasUnread(false)
      }
    }
    
    checkNotifications()
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <div className="w-64 border-r bg-tertiary hidden md:flex flex-col h-full transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
      <div className="p-6 text-center border-b border-border/10 mb-2">
        <img 
          src="/logo.png" 
          alt="PCCOE Logo" 
          className="h-16 mx-auto object-contain mb-2 drop-shadow-md" 
        />
        <p className="text-xs text-text-secondary mt-1 font-medium tracking-wide uppercase">Student Portal</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue shadow-[var(--glow)]'
                  : 'text-text-secondary hover:bg-accent-blue/5 hover:text-text-primary'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {item.label}
            </div>
            {item.label === 'Notifications' && hasUnread && (
              <span className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="glass-card p-4 mb-4 text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-text-secondary/20"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent-blue transition-all duration-700"
                strokeWidth="3"
                strokeDasharray={`${profileCompletion}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {profileCompletion}%
            </div>
          </div>
          <p className="text-xs text-text-secondary">Profile Completion</p>
        </div>
        
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
