import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, MessageSquare, Star, Megaphone, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function Notifications() {
  const { user } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [appUpdates, setAppUpdates] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      // Fetch global announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch application status updates for the student
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, status, created_at, internships(title, company_name)')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10)

      setAnnouncements(announcementsData || [])
      setAppUpdates(applicationsData || [])
    } catch (err) {
      console.error('Notifications fetch error:', err)
    } finally {
      setIsLoading(false)
    }
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
      case 'rejected': return 'text-red-400'
      default: return 'text-text-secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'selected': return 'Selected 🎉'
      case 'shortlisted': return 'Shortlisted ⭐'
      case 'under_review': return 'Under Review'
      case 'rejected': return 'Not Selected'
      default: return 'Pending'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Notifications</h1>
        <p className="text-text-secondary mt-1">Stay updated on your applications and announcements.</p>
      </div>

      {/* Application Updates */}
      {appUpdates.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-gold" />
            Application Updates
          </h2>
          <div className="space-y-3">
            {appUpdates.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 flex gap-4 border-l-4 ${
                  app.status === 'selected' ? 'border-l-emerald-400' :
                  app.status === 'shortlisted' ? 'border-l-accent-gold' :
                  'border-l-accent-blue'
                }`}
              >
                <div className="shrink-0 mt-1">
                  <Star className="w-6 h-6 text-accent-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="font-heading font-bold text-text-primary">
                      {app.internships?.title || 'Internship'}
                      {app.internships?.company_name && ` at ${app.internships.company_name}`}
                    </h3>
                    <span className="text-xs text-text-secondary shrink-0">{formatDate(app.created_at)}</span>
                  </div>
                  <p className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                    Status: {getStatusLabel(app.status)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Global Announcements */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent-blue" />
          Announcements
        </h2>
        {announcements.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Bell className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary">No announcements yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (appUpdates.length + i) * 0.05 }}
                className={`glass-card p-5 flex gap-4 border-l-4 ${
                  ann.type === 'urgent' ? 'border-l-red-500 bg-red-500/5' :
                  ann.type === 'event' ? 'border-l-accent-gold' :
                  'border-l-accent-blue'
                }`}
              >
                <div className="shrink-0 mt-1">
                  {ann.type === 'urgent' && <MessageSquare className="w-6 h-6 text-red-400" />}
                  {ann.type === 'event' && <Star className="w-6 h-6 text-accent-gold" />}
                  {ann.type === 'info' && <Bell className="w-6 h-6 text-accent-blue" />}
                </div>
                <div>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="font-heading font-bold text-text-primary">{ann.title}</h3>
                    <span className="text-xs text-text-secondary shrink-0">{formatDate(ann.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{ann.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
