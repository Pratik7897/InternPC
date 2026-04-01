import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, UploadCloud, Briefcase, FileText, Bell, LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

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

  // Fetch on mount + realtime subscription so value stays in sync across tabs/devices
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

    // Realtime: update whenever the profiles row changes
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

  return (
    <div className="w-64 border-r border-white/10 bg-tertiary hidden md:flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-heading font-bold text-accent-blue tracking-tight">PCCOE</h1>
        <p className="text-xs text-text-secondary mt-1">Student Portal</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue shadow-[var(--glow)]'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="glass-card p-4 mb-4 text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent-blue transition-all duration-700"
                strokeWidth="3"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {completionPercentage}%
            </div>
          </div>
          <p className="text-xs text-text-secondary">Profile Completion</p>
        </div>
        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 shrink-0">
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
