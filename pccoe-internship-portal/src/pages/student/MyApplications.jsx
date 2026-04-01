import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building, MapPin, Search, TrendingUp, Clock, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const statusConfig = {
  applied: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Applied', icon: Clock },
  shortlisted: { color: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30', label: 'Shortlisted', icon: AlertCircle },
  under_review: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Under Review', icon: Clock },
  interview: { color: 'bg-accent-teal/20 text-accent-teal border-accent-teal/30', label: 'Interview Scheduled', icon: TrendingUp },
  selected: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Selected', icon: CheckCircle2 },
  rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Not Selected', icon: AlertCircle },
}

export default function MyApplications() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    responseRate: 0,
  })

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
      
      const apps = data || []
      const total = apps.length
      const pending = apps.filter(a => a.status === 'applied' || a.status === 'under_review').length
      const shortlisted = apps.filter(a => a.status === 'shortlisted').length
      const interview = apps.filter(a => a.status === 'interview').length
      const selected = apps.filter(a => a.status === 'selected').length
      const rejected = apps.filter(a => a.status === 'rejected').length
      const responded = shortlisted + interview + selected + rejected
      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0
      
      setStats({ total, pending, shortlisted, interview, selected, rejected, responseRate })
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

      {/* Application Insights Dashboard */}
      {!isLoading && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Briefcase className="w-4 h-4" /> Total Applied
            </div>
            <p className="text-2xl font-heading font-bold text-text-primary">{stats.total}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Clock className="w-4 h-4" /> Pending
            </div>
            <p className="text-2xl font-heading font-bold text-blue-400">{stats.pending}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <AlertCircle className="w-4 h-4" /> Shortlisted
            </div>
            <p className="text-2xl font-heading font-bold text-accent-gold">{stats.shortlisted}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <TrendingUp className="w-4 h-4" /> Interviews
            </div>
            <p className="text-2xl font-heading font-bold text-accent-teal">{stats.interview}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" /> Selected
            </div>
            <p className="text-2xl font-heading font-bold text-emerald-400">{stats.selected}</p>
          </motion.div>
        </div>
      )}

      {/* Response Rate & Status Breakdown Bar */}
      {!isLoading && stats.total > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary">Application Response Rate</h3>
            <span className="text-lg font-heading font-bold text-text-primary">{stats.responseRate}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
            {stats.pending > 0 && (
              <div 
                className="bg-blue-500/70 h-full transition-all duration-500"
                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                title={`Pending: ${stats.pending}`}
              />
            )}
            {stats.shortlisted > 0 && (
              <div 
                className="bg-accent-gold/70 h-full transition-all duration-500"
                style={{ width: `${(stats.shortlisted / stats.total) * 100}%` }}
                title={`Shortlisted: ${stats.shortlisted}`}
              />
            )}
            {stats.interview > 0 && (
              <div 
                className="bg-accent-teal/70 h-full transition-all duration-500"
                style={{ width: `${(stats.interview / stats.total) * 100}%` }}
                title={`Interviews: ${stats.interview}`}
              />
            )}
            {stats.selected > 0 && (
              <div 
                className="bg-emerald-500/70 h-full transition-all duration-500"
                style={{ width: `${(stats.selected / stats.total) * 100}%` }}
                title={`Selected: ${stats.selected}`}
              />
            )}
            {stats.rejected > 0 && (
              <div 
                className="bg-red-500/50 h-full transition-all duration-500"
                style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
                title={`Rejected: ${stats.rejected}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500/70"></span> Pending ({stats.pending})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-gold/70"></span> Shortlisted ({stats.shortlisted})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-teal/70"></span> Interviews ({stats.interview})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500/70"></span> Selected ({stats.selected})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/50"></span> Rejected ({stats.rejected})</span>
          </div>
        </motion.div>
      )}

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
