import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, FileText, Mail, Bell, LogOut, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Students', icon: Users, path: '/admin/students' },
  { label: 'Internships', icon: Briefcase, path: '/admin/internships' },
  { label: 'Applications', icon: FileText, path: '/admin/applications' },
  { label: 'Email Center', icon: Mail, path: '/admin/email' },
  { label: 'Announcements', icon: Bell, path: '/admin/announcements' },
]

export default function AdminSidebar() {
  const { signOut } = useAuthStore()
  return (
    <div className="w-64 border-r border-white/10 bg-tertiary hidden md:flex flex-col h-full object-contain">
      <div className="p-6">
        <h1 className="text-2xl font-heading font-bold text-accent-gold tracking-tight">PCCOE</h1>
        <p className="text-xs text-text-secondary mt-1">Placement Cell Admin</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-accent-gold/10 text-accent-gold border-l-2 border-accent-gold shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

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
  )
}
