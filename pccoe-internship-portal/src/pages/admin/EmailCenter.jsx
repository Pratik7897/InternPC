import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Image as ImageIcon, Paperclip, Users, Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import toast from 'react-hot-toast'

export default function EmailCenter() {
  const [isSending, setIsSending] = useState(false)
  const [recipient, setRecipient] = useState('all')

  const handleSend = async (e) => {
    e.preventDefault()
    setIsSending(true)
    
    // Mock API call to Supabase Edge Function configured with Resend
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.success('Email campaign successfully queued via Resend!')
    setIsSending(false)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            Communication Hub <Badge className="bg-accent-blue/10 text-accent-blue border-accent-blue/20">Edge Function Ready</Badge>
          </h1>
          <p className="text-text-secondary mt-1">Send bulk emails to students using the Resend API.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Composer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-6 md:p-8 border border-white/10 flex flex-col">
          <form onSubmit={handleSend} className="space-y-6 flex-1 flex flex-col">
            
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <Label className="text-text-secondary text-right">To:</Label>
              <select 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full flex h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all" className="bg-background">All Registered Students (4,521)</option>
                <option value="be_cse" className="bg-background">BE - Computer Science (450)</option>
                <option value="placed" className="bg-background">Unplaced Students (1,416)</option>
                <option value="custom" className="bg-background">Custom Segment...</option>
              </select>
            </div>

            <div className="grid grid-cols-[100px_1fr] items-center gap-4 border-b border-white/10 pb-6">
              <Label className="text-text-secondary text-right">Subject:</Label>
              <Input placeholder="e.g. Upcoming Placement Drive: Google" required className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-accent-blue shadow-none" />
            </div>

            <div className="flex-1 min-h-[300px] flex flex-col pt-2">
              <textarea 
                className="w-full h-full flex-1 bg-transparent resize-none outline-none text-text-primary text-sm leading-relaxed" 
                placeholder="Write your email content here. HTML is fully supported..."
                required
              ></textarea>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Button type="button" size="icon" variant="ghost" className="text-text-secondary hover:text-white"><ImageIcon className="w-4 h-4" /></Button>
                 <Button type="button" size="icon" variant="ghost" className="text-text-secondary hover:text-white"><Paperclip className="w-4 h-4" /></Button>
              </div>
              <Button type="submit" disabled={isSending} className="gap-2 shadow-[var(--glow)] px-8">
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Campaign</>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Templates & Info Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent-gold" /> Quick Templates</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:border-accent-blue/50 transition-colors text-sm font-medium">
                New Internship Alert
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:border-accent-blue/50 transition-colors text-sm font-medium">
                Profile Completion Reminder
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:border-accent-blue/50 transition-colors text-sm font-medium">
                Interview Shortlist
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-accent-teal/20 bg-accent-teal/5">
            <h3 className="font-heading font-bold text-accent-teal mb-2">Delivery Metrics</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Open Rate</span>
                <span className="font-bold">68%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Click Rate</span>
                <span className="font-bold">24%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Bounced</span>
                <span className="font-bold text-red-400">0.2%</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
