import { motion } from 'framer-motion'
import { Bell, CheckSquare, MessageSquare, Star } from 'lucide-react'

const notifications = [
  {
    id: 1,
    title: 'Profile Shortlisted!',
    message: 'Your application for Data Science Intern at Analytics Corp has been shortlisted. Check your email for next steps.',
    time: '2 hours ago',
    type: 'success',
    read: false
  },
  {
    id: 2,
    title: 'New Internship Posted',
    message: 'Google has posted a new Software Engineering role that matches your skills.',
    time: '1 day ago',
    type: 'info',
    read: false
  },
  {
    id: 3,
    title: 'Admin Message',
    message: 'Please ensure your resume is updated before the upcoming placement drive next week.',
    time: '3 days ago',
    type: 'alert',
    read: true
  }
]

export default function Notifications() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">Stay updated on your applications and announcements.</p>
        </div>
        <button className="text-sm text-accent-blue hover:underline font-medium">Mark all as read</button>
      </div>

      <div className="space-y-4">
        {notifications.map((note, i) => (
          <motion.div 
            key={note.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-5 flex gap-4 ${note.read ? 'opacity-70 bg-white/[0.02]' : 'border-l-4 border-l-accent-blue bg-white/5'}`}
          >
            <div className="shrink-0 mt-1">
              {note.type === 'success' && <Star className="w-6 h-6 text-accent-gold" fill="currentColor" />}
              {note.type === 'info' && <Bell className="w-6 h-6 text-accent-blue" />}
              {note.type === 'alert' && <MessageSquare className="w-6 h-6 text-accent-teal" />}
            </div>
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className={`font-heading font-bold ${note.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {note.title}
                </h3>
                <span className="text-xs text-text-secondary shrink-0">{note.time}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{note.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
