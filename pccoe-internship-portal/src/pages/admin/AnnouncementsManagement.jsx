import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Trash2, Clock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

const mockAnnouncements = [
  { id: '1', title: 'Resume Review Workshop', content: 'Join us on Friday at 3PM in the main auditorium for a resume building session by industry experts.', date: 'Oct 20, 2026', type: 'event' },
  { id: '2', title: 'TCS Ninja Hiring 2026 Batch', content: 'TCS is visiting next week. Ensure your profile is 100% complete and you have applied through the portal.', date: 'Oct 19, 2026', type: 'urgent' },
  { id: '3', title: 'New Mock Assessment Links', content: 'The aptitude test links have been mailed to all registered students. Deadline to complete is Sunday.', date: 'Oct 15, 2026', type: 'info' }
]

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements)
  const [isComposing, setIsComposing] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState('info')

  const handlePost = (e) => {
    e.preventDefault()
    const newAnn = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: 'Just now',
      type: newType
    }
    setAnnouncements([newAnn, ...announcements])
    setIsComposing(false)
    setNewTitle('')
    setNewContent('')
    toast.success('Announcement published globally.')
  }

  const handleDelete = (id) => {
    setAnnouncements(announcements.filter(a => a.id !== id))
    toast.success('Announcement removed.')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/20 text-accent-gold flex items-center justify-center">
            <Megaphone className="w-6 h-6 outline-none" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">Announcements</h1>
            <p className="text-text-secondary mt-1">Broadcast real-time global notifications to all students.</p>
          </div>
        </div>
        {!isComposing && (
          <Button onClick={() => setIsComposing(true)} className="gap-2 shadow-[var(--glow)]">
            <Plus className="w-4 h-4"/> New Broadcast
          </Button>
        )}
      </div>

      {isComposing && (
        <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} className="glass-card p-6 border border-accent-blue/30 overflow-hidden">
          <form onSubmit={handlePost} className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-heading font-bold mb-4">Compose Broadcast</h3>
              <select 
                value={newType} 
                onChange={e => setNewType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:border-accent-blue"
              >
                <option value="info">General Info</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
              </select>
            </div>
            
            <Input placeholder="Announcement Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus className="font-medium text-lg border-b-0 rounded-b-none focus-visible:ring-0 focus-visible:border-accent-blue" />
            <textarea 
              placeholder="What do students need to know right now?" 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl rounded-t-none p-4 text-sm resize-none focus:outline-none focus:border-accent-blue"
            ></textarea>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsComposing(false)}>Cancel</Button>
              <Button type="submit" className="shadow-[var(--glow)]">Publish to Ticker</Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {announcements.map((ann, i) => (
          <motion.div 
            key={ann.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-6 flex gap-5 border-l-4 ${ann.type === 'urgent' ? 'border-red-500' : ann.type === 'event' ? 'border-accent-gold' : 'border-accent-blue'}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold font-heading">{ann.title}</h3>
                <Badge variant={ann.type === 'urgent' ? 'destructive' : 'outline'} className="text-[10px] uppercase tracking-wider py-0 leading-tight bg-white/5">
                  {ann.type}
                </Badge>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">{ann.content}</p>
              <div className="text-xs text-text-secondary flex items-center gap-2">
                <Clock className="w-3 h-3" /> Broadcasted: {ann.date}
              </div>
            </div>
            <button onClick={() => handleDelete(ann.id)} className="shrink-0 p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg h-fit transition-colors">
              <Trash2 className="w-5 h-5"/>
            </button>
          </motion.div>
        ))}
      </div>

    </div>
  )
}
