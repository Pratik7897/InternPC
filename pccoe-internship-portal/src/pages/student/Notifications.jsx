import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckSquare, MessageSquare, Star, Briefcase, AlertTriangle, FileEdit, CheckCheck, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const ABANDONED_FORM_KEY = 'profile_form_started'

function getTypeIcon(type) {
  switch (type) {
    case 'success': return <Star className="w-5 h-5 text-accent-gold" fill="currentColor" />
    case 'info': return <Bell className="w-5 h-5 text-accent-blue" />
    case 'alert': return <MessageSquare className="w-5 h-5 text-accent-teal" />
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />
    case 'action': return <FileEdit className="w-5 h-5 text-purple-400" />
    case 'apply': return <Briefcase className="w-5 h-5 text-accent-blue" />
    default: return <Bell className="w-5 h-5 text-accent-blue" />
  }
}

function getBorderColor(type) {
  switch (type) {
    case 'success': return 'border-l-accent-gold'
    case 'warning': return 'border-l-amber-400'
    case 'action': return 'border-l-purple-400'
    case 'apply': return 'border-l-accent-blue'
    default: return 'border-l-accent-blue'
  }
}

export default function Notifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('read_notification_ids') || '[]'))
    } catch { return new Set() }
  })

  useEffect(() => {
    if (user) buildNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const buildNotifications = async () => {
    setIsLoading(true)
    const smartNotifs = []

    try {
      // ── 1. Check if user has any applications ──────────────────────────
      const { data: appData } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', user.id)

      if (!appData || appData.length === 0) {
        smartNotifs.push({
          id: 'smart-no-applications',
          title: 'You haven\'t applied to any internships yet!',
          message: 'Explore the Browse Internships section and apply to roles that match your skills. The sooner you apply, the better your chances.',
          time: 'Just now',
          type: 'apply',
          read: false,
          link: '/student/internships',
          linkLabel: 'Browse Internships →',
          smart: true,
        })
      }

      // ── 2. Check if user abandoned the profile form mid-way ────────────
      const profileAbandonedAt = localStorage.getItem(ABANDONED_FORM_KEY)
      if (profileAbandonedAt) {
        const diff = Date.now() - parseInt(profileAbandonedAt, 10)
        const minutesAgo = Math.round(diff / 60000)
        const timeLabel = minutesAgo < 2 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`

        smartNotifs.push({
          id: 'smart-abandoned-form',
          title: 'Incomplete Profile Form',
          message: 'It looks like you started filling your profile but didn\'t finish. Complete it now so companies can shortlist you.',
          time: timeLabel,
          type: 'action',
          read: false,
          link: '/student/profile',
          linkLabel: 'Continue Profile →',
          smart: true,
        })
      }

      // ── 2b. Check if user abandoned an internship application ──────────
      const appAbandonedAt = localStorage.getItem('internship_app_started')
      if (appAbandonedAt) {
        const diff = Date.now() - parseInt(appAbandonedAt, 10)
        const minutesAgo = Math.round(diff / 60000)
        const timeLabel = minutesAgo < 2 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`

        smartNotifs.push({
          id: 'smart-abandoned-app',
          title: 'Unfinished Application',
          message: 'You have an unsaved application in your browser. Finish submitting your cover note to the internship you were viewing.',
          time: timeLabel,
          type: 'action',
          read: false,
          link: '/student/internships',
          linkLabel: 'Go to Internships →',
          smart: true,
        })
      }

      // ── 3. Check profile completion for a nudge ────────────────────────
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_completion')
        .eq('id', user.id)
        .maybeSingle()

      const completion = profileData?.profile_completion ?? 0
      if (completion < 60 && completion > 0) {
        smartNotifs.push({
          id: 'smart-low-profile',
          title: 'Your profile is less than 60% complete',
          message: `Your profile is only ${completion}% complete. Companies prioritize fully completed profiles. Finish your setup to stand out!`,
          time: 'Today',
          type: 'warning',
          read: false,
          link: '/student/profile',
          linkLabel: 'Complete Profile →',
          smart: true,
        })
      }

      // ── 4. Fetch application status updates ───────────────────────────
      const { data: appUpdates } = await supabase
        .from('applications')
        .select('id, status, internships(title, company_name), applied_at')
        .eq('student_id', user.id)
        .order('applied_at', { ascending: false })
        .limit(5)

      if (appUpdates && appUpdates.length > 0) {
        appUpdates.forEach((app) => {
          if (['shortlisted', 'interview', 'selected'].includes(app.status)) {
            const statusLabels = {
              shortlisted: { label: 'Shortlisted', type: 'success' },
              interview: { label: 'Interview Scheduled', type: 'success' },
              selected: { label: 'Selected! 🎉', type: 'success' },
            }
            const cfg = statusLabels[app.status]
            if (cfg) {
              smartNotifs.push({
                id: `app-status-${app.id}`,
                title: `${cfg.label} — ${app.internships?.company_name}`,
                message: `Your application for "${app.internships?.title}" at ${app.internships?.company_name} has been updated to: ${cfg.label}.`,
                time: new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                type: cfg.type,
                read: false,
                smart: false,
              })
            }
          }
        })
      }

      // ── 5. Static admin announcements (static fallback) ───────────────
      smartNotifs.push({
        id: 'static-resume-tip',
        title: 'Admin Tip: Keep your resume updated',
        message: 'Please ensure your resume is updated before the upcoming placement drive. Companies will review them directly.',
        time: '3 days ago',
        type: 'alert',
        read: true,
        smart: false,
      })

    } catch (err) {
      console.error('Error building notifications:', err)
    } finally {
      setNotifications(smartNotifs)
      setIsLoading(false)
    }
  }

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set([...prev, id])
      localStorage.setItem('read_notification_ids', JSON.stringify([...next]))
      return next
    })
    // Clear flags if relevant notification is read
    if (id === 'smart-abandoned-form') {
      localStorage.removeItem(ABANDONED_FORM_KEY)
    }
    if (id === 'smart-abandoned-app') {
      localStorage.removeItem('internship_app_started')
    }
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    const next = new Set([...readIds, ...allIds])
    setReadIds(next)
    localStorage.setItem('read_notification_ids', JSON.stringify([...next]))
    localStorage.removeItem(ABANDONED_FORM_KEY)
    localStorage.removeItem('internship_app_started')
  }

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    markRead(id)
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id) && !n.read).length

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-text-primary">Notifications</h1>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-blue text-white text-xs font-bold shadow-[var(--glow)]">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-text-secondary mt-1">Stay updated on your applications and important alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-accent-blue hover:underline font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Bell className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-30" />
          <p className="text-text-secondary">You're all caught up! No notifications right now.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((note, i) => {
              const isRead = readIds.has(note.id) || note.read
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ delay: i * 0.07 }}
                  layout
                  className={`glass-card p-5 flex gap-4 transition-all duration-300 group ${
                    isRead
                      ? 'opacity-60 bg-white/[0.02]'
                      : `border-l-4 ${getBorderColor(note.type)} bg-white/5`
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-1">
                    {getTypeIcon(note.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className={`font-heading font-bold text-sm leading-snug ${isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                        {note.title}
                        {note.smart && !isRead && (
                          <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue align-middle">SMART</span>
                        )}
                      </h3>
                      <span className="text-xs text-text-secondary shrink-0">{note.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{note.message}</p>

                    {/* Action link for smart notifications */}
                    {note.link && (
                      <a
                        href={note.link}
                        onClick={() => markRead(note.id)}
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-blue hover:underline"
                      >
                        {note.linkLabel}
                      </a>
                    )}
                  </div>

                  {/* Mark read / Dismiss */}
                  <div className="shrink-0 flex flex-col items-end gap-2 ml-2">
                    {!isRead && (
                      <button
                        onClick={() => markRead(note.id)}
                        title="Mark as read"
                        className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCheck className="w-4 h-4 text-accent-teal" />
                      </button>
                    )}
                    {note.smart && (
                      <button
                        onClick={() => dismiss(note.id)}
                        title="Dismiss"
                        className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
