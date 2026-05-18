import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, CheckSquare, MessageSquare, Star, Briefcase, AlertTriangle, 
  FileEdit, CheckCheck, Trash2, Megaphone, Loader2, Filter, Clock, 
  TrendingUp, AlertCircle, CheckCircle2, Building 
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const ABANDONED_FORM_KEY = 'profile_form_started'

const filterTabs = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'applications', label: 'Applications', icon: Building },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'smart', label: 'Smart Alerts', icon: Star },
]

const statusIcons = {
  selected: CheckCircle2,
  shortlisted: Star,
  under_review: Clock,
  interview: TrendingUp,
  rejected: AlertCircle,
  applied: Clock,
}

export default function Notifications() {
  const { user } = useAuthStore()
  
  // Real notifications from DB
  const [announcements, setAnnouncements] = useState([])
  const [appUpdates, setAppUpdates] = useState([])
  
  // Smart notifications generated locally
  const [smartNotifs, setSmartNotifs] = useState([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('read_notification_ids') || '[]'))
    } catch { return new Set() }
  })
  
  const [summary, setSummary] = useState({ total: 0, unread: 0, urgent: 0 })

  useEffect(() => {
    if (user?.id) fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchNotifications = async () => {
    setIsLoading(true)
    const localSmart = []
    
    try {
      // ── 1. Fetch DB Announcements ─────────────────────────────────────
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      // ── 2. Fetch DB Application Updates ───────────────────────────────
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, status, applied_at, updated_at, admin_notes, internships(title, company_name, company_logo_url)')
        .eq('student_id', user.id)
        .order('applied_at', { ascending: false })
        .limit(20)

      const apps = applicationsData || []
      const anns = announcementsData || []
      setAppUpdates(apps)
      setAnnouncements(anns)

      // ── 3. Build Smart Notifications ──────────────────────────────────
      
      // A. Check if user has any applications
      if (apps.length === 0) {
        localSmart.push({
          id: 'smart-no-applications',
          title: 'You haven\'t applied to any internships yet!',
          message: 'Explore the Browse Internships section and apply to roles that match your skills. The sooner you apply, the better your chances.',
          time: 'Just now',
          type: 'apply', // icon helper will handle this
          link: '/student/internships',
          linkLabel: 'Browse Internships →',
          smart: true,
        })
      }

      // B. Check if user abandoned the profile form mid-way
      const profileAbandonedAt = localStorage.getItem(ABANDONED_FORM_KEY)
      if (profileAbandonedAt) {
        const diff = Date.now() - parseInt(profileAbandonedAt, 10)
        const minutesAgo = Math.round(diff / 60000)
        const timeLabel = minutesAgo < 2 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`

        localSmart.push({
          id: 'smart-abandoned-form',
          title: 'Incomplete Profile Form',
          message: 'It looks like you started filling your profile but didn\'t finish. Complete it now so companies can shortlist you.',
          time: timeLabel,
          type: 'action',
          link: '/student/profile',
          linkLabel: 'Continue Profile →',
          smart: true,
        })
      }

      // C. Check if user abandoned an internship application
      const appAbandonedAt = localStorage.getItem('internship_app_started')
      if (appAbandonedAt) {
        const diff = Date.now() - parseInt(appAbandonedAt, 10)
        const minutesAgo = Math.round(diff / 60000)
        const timeLabel = minutesAgo < 2 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`

        localSmart.push({
          id: 'smart-abandoned-app',
          title: 'Unfinished Application',
          message: 'You have an unsaved application in your browser. Finish submitting your cover note to the internship you were viewing.',
          time: timeLabel,
          type: 'action',
          link: '/student/internships',
          linkLabel: 'Go to Internships →',
          smart: true,
        })
      }

      // D. Check profile completion for a nudge
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_completion')
        .eq('id', user.id)
        .maybeSingle()

      const completion = profileData?.profile_completion ?? 0
      if (completion < 60 && completion > 0) {
        localSmart.push({
          id: 'smart-low-profile',
          title: 'Your profile is less than 60% complete',
          message: `Your profile is only ${completion}% complete. Companies prioritize fully completed profiles. Finish your setup to stand out!`,
          time: 'Today',
          type: 'warning',
          link: '/student/profile',
          linkLabel: 'Complete Profile →',
          smart: true,
        })
      }

      setSmartNotifs(localSmart)

      // ── 4. Calculate Summary ──────────────────────────────────────────
      const unreadAnns = anns.filter(a => a.type === 'urgent' && !readIds.has(`ann-${a.id}`)).length
      const unreadApps = apps.filter(a => a.status !== 'applied' && !readIds.has(`app-${a.id}`)).length
      const unreadSmart = localSmart.filter(s => !readIds.has(s.id)).length
      
      const urgentCount = anns.filter(a => a.type === 'urgent').length

      setSummary({
        total: apps.length + anns.length + localSmart.length,
        unread: unreadAnns + unreadApps + unreadSmart,
        urgent: urgentCount,
      })

    } catch (err) {
      console.error('Notifications fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (id, type) => {
    const fullId = type ? `${type}-${id}` : id
    setReadIds(prev => {
      const next = new Set([...prev, fullId])
      localStorage.setItem('read_notification_ids', JSON.stringify([...next]))
      return next
    })

    // Clear flags if relevant smart notification is read
    if (id === 'smart-abandoned-form') {
      localStorage.removeItem(ABANDONED_FORM_KEY)
    }
    if (id === 'smart-abandoned-app') {
      localStorage.removeItem('internship_app_started')
    }
  }

  const markAllAsRead = () => {
    const next = new Set(readIds)
    appUpdates.forEach(a => next.add(`app-${a.id}`))
    announcements.forEach(a => next.add(`ann-${a.id}`))
    smartNotifs.forEach(s => next.add(s.id))
    
    setReadIds(next)
    localStorage.setItem('read_notification_ids', JSON.stringify([...next]))
    
    // Clear all flags
    localStorage.removeItem(ABANDONED_FORM_KEY)
    localStorage.removeItem('internship_app_started')
  }

  const dismissSmart = (id) => {
    setSmartNotifs(prev => prev.filter(n => n.id !== id))
    markAsRead(id)
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'selected': return 'text-emerald-400'
      case 'shortlisted': return 'text-accent-gold'
      case 'under_review': return 'text-accent-blue'
      case 'interview': return 'text-accent-teal'
      case 'rejected': return 'text-red-400'
      default: return 'text-text-secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'selected': return 'You have been selected!'
      case 'shortlisted': return 'Shortlisted for next round'
      case 'under_review': return 'Application under review'
      case 'interview': return 'Interview scheduled'
      case 'rejected': return 'Application not selected'
      default: return 'Application submitted'
    }
  }

  const getBorderColor = (item, type) => {
    if (type === 'smart') {
      switch (item.type) {
        case 'warning': return 'border-l-amber-400'
        case 'action': return 'border-l-purple-400'
        case 'apply': return 'border-l-accent-blue'
        default: return 'border-l-accent-blue'
      }
    }
    if (item.type) { // Announcement
      return item.type === 'urgent' ? 'border-l-red-500 bg-red-500/5' :
             item.type === 'event' ? 'border-l-accent-gold' :
             'border-l-accent-blue'
    }
    // Application update
    return item.status === 'selected' ? 'border-l-emerald-400' :
           item.status === 'shortlisted' ? 'border-l-accent-gold' :
           item.status === 'interview' ? 'border-l-accent-teal' :
           item.status === 'rejected' ? 'border-l-red-400' :
           'border-l-accent-blue'
  }

  const getSmartIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />
      case 'action': return <FileEdit className="w-5 h-5 text-purple-400" />
      case 'apply': return <Briefcase className="w-5 h-5 text-accent-blue" />
      default: return <Bell className="w-5 h-5 text-accent-blue" />
    }
  }

  const isUnread = (id, type) => !readIds.has(type ? `${type}-${id}` : id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    )
  }

  const showApps = activeFilter === 'all' || activeFilter === 'applications'
  const showAnns = activeFilter === 'all' || activeFilter === 'announcements'
  const showSmart = activeFilter === 'all' || activeFilter === 'smart'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            Notifications
            {summary.unread > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-blue text-white text-xs font-bold shadow-[var(--glow)]">
                {summary.unread}
              </span>
            )}
          </h1>
          <p className="text-text-secondary mt-1">Stay updated on your applications and important alerts.</p>
        </div>
        {summary.unread > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-accent-blue hover:underline self-start font-medium"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-xl text-center border-white/5"
          >
            <p className="text-2xl font-heading font-bold text-text-primary">{summary.total}</p>
            <p className="text-xs text-text-secondary mt-1">Total Notifications</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-4 rounded-xl text-center border-white/5"
          >
            <p className="text-2xl font-heading font-bold text-accent-blue">{summary.unread}</p>
            <p className="text-xs text-text-secondary mt-1">Unread Updates</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-xl text-center border-white/5"
          >
            <p className="text-2xl font-heading font-bold text-red-400">{summary.urgent}</p>
            <p className="text-xs text-text-secondary mt-1">Urgent Alerts</p>
          </motion.div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(tab => {
          const Icon = tab.icon
          const count = tab.id === 'applications' ? appUpdates.length :
                        tab.id === 'announcements' ? announcements.length :
                        tab.id === 'smart' ? smartNotifs.length :
                        summary.total
          
          if (count === 0 && tab.id !== 'all') return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30 shadow-[var(--glow)]'
                  : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && <span className="opacity-50 text-[10px]">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {summary.total === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center"
        >
          <Bell className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">No Notifications Yet</h3>
          <p className="text-text-secondary">Application updates and announcements will appear here.</p>
        </motion.div>
      )}

      {/* Notification Feed */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          
          {/* Smart Notifications */}
          {showSmart && smartNotifs.map((note, i) => {
            const unread = isUnread(note.id)
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 flex gap-4 border-l-4 transition-all group ${
                  !unread ? 'opacity-60 bg-white/[0.02]' : `bg-white/[0.08] ${getBorderColor(note, 'smart')}`
                }`}
              >
                <div className="shrink-0 mt-1">
                  {getSmartIcon(note.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className={`font-heading font-bold text-sm leading-snug ${unread ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {note.title}
                      {unread && (
                        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue align-middle">SMART</span>
                      )}
                    </h3>
                    <span className="text-xs text-text-secondary shrink-0">{note.time}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{note.message}</p>
                  
                  {note.link && (
                    <a
                      href={note.link}
                      onClick={() => markAsRead(note.id)}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-blue hover:underline"
                    >
                      {note.linkLabel}
                    </a>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                   {unread && (
                    <button
                      onClick={() => markAsRead(note.id)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4 text-accent-teal" />
                    </button>
                   )}
                   <button
                    onClick={() => dismissSmart(note.id)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Dismiss"
                   >
                    <Trash2 className="w-4 h-4 text-destructive" />
                   </button>
                </div>
              </motion.div>
            )
          })}

          {/* Application Updates */}
          {showApps && appUpdates.map((app, i) => {
            const unread = isUnread(app.id, 'app') && app.status !== 'applied'
            const StatusIcon = statusIcons[app.status] || Clock
            return (
              <motion.div
                key={`app-${app.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (smartNotifs.length + i) * 0.03 }}
                onClick={() => markAsRead(app.id, 'app')}
                className={`glass-card p-5 flex gap-4 border-l-4 cursor-pointer transition-all ${getBorderColor(app)} ${unread ? 'bg-white/[0.08]' : ''} hover:bg-white/[0.06]`}
              >
                <div className="shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    app.status === 'selected' ? 'bg-emerald-500/20' :
                    app.status === 'shortlisted' ? 'bg-accent-gold/20' :
                    app.status === 'interview' ? 'bg-accent-teal/20' :
                    app.status === 'rejected' ? 'bg-red-500/20' :
                    'bg-accent-blue/20'
                  }`}>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(app.status)}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-text-primary truncate">
                        {app.internships?.title || 'Internship'}
                      </h3>
                      <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className="truncate">{app.internships?.company_name || 'Company'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread && <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />}
                      <span className="text-xs text-text-secondary whitespace-nowrap">{formatDate(app.applied_at)}</span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </p>
                  {app.admin_notes && (
                    <p className="text-xs text-text-secondary mt-2 p-2 bg-white/5 rounded-md border border-white/10">
                      <span className="font-medium text-text-primary">Admin Note:</span> {app.admin_notes}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Announcements */}
          {showAnns && announcements.map((ann, i) => {
            const unread = isUnread(ann.id, 'ann')
            return (
              <motion.div
                key={`ann-${ann.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (smartNotifs.length + appUpdates.length + i) * 0.03 }}
                onClick={() => markAsRead(ann.id, 'ann')}
                className={`glass-card p-5 flex gap-4 border-l-4 cursor-pointer transition-all ${getBorderColor(ann)} ${unread ? 'bg-white/[0.08]' : ''} hover:bg-white/[0.06]`}
              >
                <div className="shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    ann.type === 'urgent' ? 'bg-red-500/20' :
                    ann.type === 'event' ? 'bg-accent-gold/20' :
                    'bg-accent-blue/20'
                  }`}>
                    {ann.type === 'urgent' && <MessageSquare className="w-5 h-5 text-red-400" />}
                    {ann.type === 'event' && <Star className="w-5 h-5 text-accent-gold" />}
                    {ann.type === 'info' && <Bell className="w-5 h-5 text-accent-blue" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-text-primary">{ann.title}</h3>
                      {ann.type === 'urgent' && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">Urgent</Badge>
                      )}
                      {ann.type === 'event' && (
                        <Badge className="bg-accent-gold/20 text-accent-gold border border-accent-gold/30 text-[10px]">Event</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread && <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />}
                      <span className="text-xs text-text-secondary whitespace-nowrap">{formatDate(ann.created_at)}</span>
                    </div>
                  </div>
                   <p className="text-sm text-text-secondary leading-relaxed">{ann.body || ann.content}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
