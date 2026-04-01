import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building, MapPin, Search } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const statusConfig = {
  applied: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Applied' },
  shortlisted: { color: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30', label: 'Shortlisted' },
  interview: { color: 'bg-accent-teal/20 text-accent-teal border-accent-teal/30', label: 'Interview Scheduled' },
  selected: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Selected' },
  rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Not Selected' },
}

export default function MyApplications() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) fetchApplications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          internships (*)
        `)
        .eq('student_id', user.id)
        .order('applied_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (err) {
      toast.error('Failed to load your applications')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApps = applications.filter(app => 
    app.internships?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.internships?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">My Applications</h1>
          <p className="text-text-secondary mt-1">Track the status of your internship applications.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input 
            placeholder="Search company or role..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass shadow-xl rounded-xl overflow-hidden glass-card">
        {/* Header Row (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-sm font-semibold text-text-secondary">
          <div className="col-span-5">Role & Company</div>
          <div className="col-span-3">Applied Date</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/10">
          {isLoading ? (
             <div className="p-8 text-center text-text-secondary">Loading your applications...</div>
          ) : filteredApps.length === 0 ? (
             <div className="p-8 text-center text-text-secondary">No applications found. Time to browse some internships!</div>
          ) : filteredApps.map((app, i) => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-5 flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-white/10 rounded-lg p-1.5 shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={app.internships?.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((app.internships?.company_name || 'C').charAt(0))}&background=1e3a5f&color=60a5fa&bold=true`} 
                    alt={app.internships?.company_name} 
                    className="w-full h-full object-contain"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((app.internships?.company_name || 'C').charAt(0))}&background=1e3a5f&color=60a5fa&bold=true` }}
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-text-primary">{app.internships?.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                    <Building className="w-3 h-3" /> {app.internships?.company_name}
                    <span className="mx-1">•</span>
                    <MapPin className="w-3 h-3" /> {app.internships?.location || 'Remote'}
                  </div>
                </div>
              </div>

              <div className="col-span-3 mb-4 md:mb-0 flex md:block items-center justify-between text-sm">
                <span className="md:hidden text-text-secondary mr-2">Applied:</span>
                <span className="font-medium text-text-primary">
                  {new Date(app.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="col-span-3 mb-4 md:mb-0 flex md:block items-center justify-between text-sm">
                <span className="md:hidden text-text-secondary mr-2">Status:</span>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig[app.status]?.color || statusConfig['applied'].color}`}>
                  {statusConfig[app.status]?.label || 'Applied'}
                </span>
              </div>

              <div className="col-span-1 flex justify-end">
                {app.admin_notes && (
                  <Badge className="bg-white/10 text-white font-normal" title={app.admin_notes}>View Note</Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
