import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MessageSquare, Star, Megaphone, Loader2, CheckCheck, Filter, Clock, TrendingUp, AlertCircle, CheckCircle2, Building } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const filterTabs = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'applications', label: 'Applications', icon: Building },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
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
  const [announcements, setAnnouncements] = useState([])
  const [appUpdates, setAppUpdates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [readIds, setReadIds] = useState(new Set())
  const [summary, setSummary] = useState({ total: 0, unread: 0, urgent: 0 })

  useEffect(() => {
    if (user?.id) fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

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

      const statusChanged = apps.filter(a => a.status !== 'applied')
      const urgentCount = anns.filter(a => a.type === 'urgent').length
      const unreadCount = statusChanged.length + urgentCount

      setSummary({
        total: apps.length + anns.length,
        unread: unreadCount,
        urgent: urgentCount,
      })
    } catch (err) {
      console.error('Notifications fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (id, type) => {
    setReadIds(prev => new Set([...prev, `${type}-${id}`]))
  }

  const markAllAsRead = () => {
    const allIds = new Set()
    appUpdates.filter(a => a.status !== 'applied').forEach(a => allIds.add(`app-${a.id}`))
    announcements.filter(a => a.type === 'urgent').forEach(a => allIds.add(`ann-${a.id}`))
    setReadIds(allIds)
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

  const getBorderColor = (item) => {
    if (item.type) {
      return item.type === 'urgent' ? 'border-l-red-500 bg-red-500/5' :
             item.type === 'event' ? 'border-l-accent-gold' :
             'border-l-accent-blue'
    }
    return item.status === 'selected' ? 'border-l-emerald-400' :
           item.status === 'shortlisted' ? 'border-l-accent-gold' :
           item.status === 'interview' ? 'border-l-accent-teal' :
           item.status === 'rejected' ? 'border-l-red-400' :
           'border-l-accent-blue'
  }

  const getStatusIcon = (status) => {
    const Icon = statusIcons[status] || Clock
    return Icon
  }

  const isUnread = (id, type) => !readIds.has(`${type}-${id}`)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    )
  }

  const showApps = activeFilter === 'all' || activeFilter === 'applications'
  const showAnns = activeFilter === 'all' || activeFilter === 'announcements'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">Stay updated on your applications and announcements.</p>
        </div>
        {summary.unread > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-accent-blue hover:underline self-start"
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
            className="glass-card p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-heading font-bold text-text-primary">{summary.total}</p>
            <p className="text-xs text-text-secondary mt-1">Total Notifications</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-heading font-bold text-accent-blue">{summary.unread}</p>
            <p className="text-xs text-text-secondary mt-1">Unread Updates</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-heading font-bold text-red-400">{summary.urgent}</p>
            <p className="text-xs text-text-secondary mt-1">Urgent Alerts</p>
          </motion.div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                  : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
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
      <div className="space-y-3">
        <AnimatePresence>
          {/* Application Updates */}
          {showApps && appUpdates.map((app, i) => {
            const unread = isUnread(app.id, 'app') && app.status !== 'applied'
            const StatusIcon = getStatusIcon(app.status)
            return (
              <motion.div
                key={`app-${app.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
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
            const unread = isUnread(ann.id, 'ann') && ann.type === 'urgent'
            return (
              <motion.div
                key={`ann-${ann.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (appUpdates.length + i) * 0.03 }}
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
                  <p className="text-sm text-text-secondary leading-relaxed">{ann.content}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* No results for filter */}
      {summary.total > 0 && (
        ((showApps && appUpdates.length === 0) || (showAnns && announcements.length === 0)) &&
        (appUpdates.length === 0 || announcements.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-text-secondary"
          >
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No {activeFilter} notifications to display.</p>
          </motion.div>
        )
      )}
    </div>
  )
}
