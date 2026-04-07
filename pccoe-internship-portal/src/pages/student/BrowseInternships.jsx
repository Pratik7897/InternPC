import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, DollarSign, Briefcase, X, ChevronRight, RefreshCw, Mail, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { fetchGmailInternships } from '../../lib/gmail'

export default function BrowseInternships() {
  const { user, providerToken } = useAuthStore()
  const [search, setSearch] = useState('')
  const [internships, setInternships] = useState([])
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [selectedJob, setSelectedJob] = useState(null)
  const [coverNote, setCoverNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGmailLoading, setIsGmailLoading] = useState(false)
  const [gmailCount, setGmailCount] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'portal' | 'gmail'

  useEffect(() => {
    if (user) {
      fetchInternships()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, providerToken])

  const fetchInternships = async () => {
    setIsLoading(true)
    try {
      // 1. Always fetch active internships from Supabase
      const { data: jobsData, error: jobsError } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // 2. Fetch student's existing applications
      const { data: appliedData } = await supabase
        .from('applications')
        .select('internship_id')
        .eq('student_id', user.id)

      setAppliedJobs(new Set((appliedData || []).map(app => app.internship_id)))

      const portalJobs = jobsData || []

      // 3. If they have a Google token, fetch Gmail internships
      let gmailJobs = []
      if (providerToken) {
        setIsGmailLoading(true)
        try {
          gmailJobs = await fetchGmailInternships(providerToken)
          setGmailCount(gmailJobs.length)
          if (gmailJobs.length > 0) {
            toast.success(`Found ${gmailJobs.length} internship email${gmailJobs.length > 1 ? 's' : ''} from your Gmail!`, {
              icon: '📧',
              duration: 3000
            })
          }
        } catch (gmailErr) {
          console.error('Gmail fetch failed:', gmailErr)
        } finally {
          setIsGmailLoading(false)
        }
      }

      // Portal listings first, Gmail emails after
      setInternships([...portalJobs, ...gmailJobs])
    } catch (error) {
      toast.error('Failed to load internships.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedJob) return
    try {
      const { error } = await supabase.from('applications').insert({
        student_id: user.id,
        internship_id: selectedJob.id,
        cover_note: coverNote
      })
      if (error) throw error

      toast.success('Application submitted successfully!')
      setAppliedJobs(prev => new Set([...prev, selectedJob.id]))
      setSelectedJob(null)
      setCoverNote('')
      localStorage.removeItem('internship_app_started')
    } catch (error) {
      toast.error(error.message || 'Application failed.')
    }
  }

  const handleCoverNoteChange = (e) => {
    const val = e.target.value
    setCoverNote(val)
    if (val.trim() && !localStorage.getItem('internship_app_started')) {
      localStorage.setItem('internship_app_started', Date.now().toString())
    } else if (!val.trim()) {
      localStorage.removeItem('internship_app_started')
    }
  }

  // Filter internships based on search and active tab
  const filteredInternships = internships.filter(job => {
    const matchSearch =
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'gmail' && job.is_gmail) ||
      (activeFilter === 'portal' && !job.is_gmail)
    return matchSearch && matchFilter
  })

  const portalCount = internships.filter(j => !j.is_gmail).length
  const totalGmailCount = internships.filter(j => j.is_gmail).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Browse Internships</h1>
          <p className="text-text-secondary mt-1">
            Discover opportunities from the portal
            {providerToken && ' and your Gmail inbox'}.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or companies..."
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchInternships}
            disabled={isLoading}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isGmailLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Gmail Connect Banner (only shown if no Google token) */}
      {!providerToken && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-500/20 bg-amber-500/5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">Connect Gmail to see more internships</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Log in with your PCCOE Google account to automatically see internship emails like "Hiring", "Off-Campus", "Internship Opportunity" from your inbox.
              </p>
            </div>
          </div>
          <a
            href="/login"
            className="shrink-0 text-xs font-medium text-amber-300 border border-amber-500/30 bg-amber-500/10 px-4 py-2 rounded-lg hover:bg-amber-500/20 transition-colors whitespace-nowrap"
          >
            Sign in with Google →
          </a>
        </motion.div>
      )}

      {/* Gmail Loading indicator */}
      {isGmailLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 glass-card border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300"
        >
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Scanning your Gmail for internship emails with keywords: <strong>Internship, Hiring, Off-Campus, Recruitment...</strong></span>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `All (${internships.length})` },
          { key: 'portal', label: `Portal (${portalCount})` },
          ...(providerToken ? [{ key: 'gmail', label: `Gmail (${totalGmailCount})` }] : [])
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeFilter === tab.key
                ? 'bg-accent-blue text-white shadow-[var(--glow)]'
                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Internship Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-10 h-10 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm">Loading internships...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="col-span-2 text-center py-20">
            <Briefcase className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-30" />
            <p className="text-text-secondary text-lg">
              {search ? `No results for "${search}"` : 'No internships found.'}
            </p>
            <p className="text-text-secondary text-sm mt-2">
              {!providerToken
                ? 'Sign in with Google to also see internship emails from your PCCOE Gmail.'
                : 'Try refreshing or check back later.'}
            </p>
          </div>
        ) : (
          filteredInternships.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 flex flex-col cursor-pointer border hover:border-accent-blue/50 transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] group"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=1e3a5f&color=60a5fa&bold=true`}
                    alt={job.company_name}
                    className="w-full h-full object-contain"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((job.company_name || 'C').charAt(0))}&background=1e3a5f&color=60a5fa&bold=true` }}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  {appliedJobs.has(job.id) && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Applied ✓</Badge>
                  )}
                  {job.is_featured && !appliedJobs.has(job.id) && (
                    <Badge className="bg-accent-gold/20 text-accent-gold border-accent-gold/30">Featured</Badge>
                  )}
                  {job.is_gmail && (
                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Gmail
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-heading font-bold mb-1 group-hover:text-accent-blue transition-colors line-clamp-2">{job.title}</h3>
              <p className="text-accent-blue font-medium text-sm mb-4">{job.company_name}</p>

              {job.description && (
                <p className="text-xs text-text-secondary mb-4 line-clamp-2 flex-1">{job.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent-blue/70" />
                  {job.location}
                  {job.work_mode && job.work_mode !== 'See Email' && ` (${job.work_mode})`}
                </span>
                {job.stipend && job.stipend !== 'See Email' && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-accent-teal/70" />
                    {job.stipend}
                  </span>
                )}
                {job.duration && job.duration !== 'See Email' && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-accent-gold/70" />
                    {job.duration}
                  </span>
                )}
              </div>

              <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  {job.is_gmail ? `Received: ${job.deadline}` : `Deadline: ${job.deadline}`}
                </p>
                <span className="text-sm font-medium text-accent-blue flex items-center gap-1 group-hover:gap-2 transition-all">
                  {job.is_gmail ? 'Open Email' : 'View Details'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedJob(null)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card border border-white/20 bg-secondary/90 shadow-2xl custom-scrollbar"
            >
              <div className="sticky top-0 bg-secondary/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between z-10">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                  {selectedJob.is_gmail && <Mail className="w-5 h-5 text-blue-400" />}
                  {selectedJob.is_gmail ? 'Email Internship' : 'Internship Details'}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-white/10 rounded-xl p-2 shrink-0 border border-white/10 flex items-center justify-center">
                    <img
                      src={selectedJob.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company_name || 'C')}&background=1e3a5f&color=60a5fa&bold=true`}
                      alt={selectedJob.company_name}
                      className="w-full h-full object-contain"
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((selectedJob.company_name || 'C').charAt(0))}&background=1e3a5f&color=60a5fa&bold=true` }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-heading leading-tight">{selectedJob.title}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-accent-blue text-lg">{selectedJob.company_name}</p>
                      {selectedJob.is_gmail && (
                        <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 text-xs">
                          <Mail className="w-3 h-3" /> From Gmail Inbox
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass rounded-xl">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Stipend</p>
                    <p className="font-medium text-sm">{selectedJob.stipend || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Duration</p>
                    <p className="font-medium text-sm">{selectedJob.duration || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Location</p>
                    <p className="font-medium text-sm">{selectedJob.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">
                      {selectedJob.is_gmail ? 'Received' : 'Deadline'}
                    </p>
                    <p className="font-medium text-sm">{selectedJob.deadline || '—'}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">
                      {selectedJob.is_gmail ? 'Email Preview' : 'Description'}
                    </h3>
                    <p className="text-text-secondary leading-relaxed text-sm">{selectedJob.description}</p>
                  </div>
                )}

                {/* Skills / Requirements (portal listings only) */}
                {!selectedJob.is_gmail && (selectedJob.requirements?.length > 0 || selectedJob.skills_required?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Requirements & Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requirements?.map(req => (
                        <Badge key={req} variant="outline">{req}</Badge>
                      ))}
                      {selectedJob.skills_required?.map(skill => (
                        <Badge key={skill} variant="outline" className="border-accent-blue text-accent-blue">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Area */}
                <div className="border-t border-white/10 pt-6 mt-6">
                  {selectedJob.is_gmail ? (
                    <>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4 text-sm text-blue-300">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> This internship was found in your Gmail
                        </p>
                        <p>The email has details like contact info, skills required, and how to apply. Open the original email to read everything and apply directly.</p>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => window.open(selectedJob.apply_link, '_blank')}
                          className="flex-1 shadow-[var(--glow)] gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Open in Gmail
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">
                          Close
                        </Button>
                      </div>
                    </>
                  ) : !appliedJobs.has(selectedJob.id) ? (
                    <>
                      <h3 className="text-lg font-bold mb-3">Apply for this role</h3>
                      <p className="text-sm text-text-secondary mb-3">
                        Add a brief cover note (optional). Your profile, resume, and video will be shared automatically.
                      </p>
                      <textarea
                        value={coverNote}
                        onChange={handleCoverNoteChange}
                        placeholder="Why are you a good fit?"
                        className="w-full h-24 rounded-lg bg-white/5 border border-white/10 p-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none resize-none mb-4"
                      ></textarea>
                      <div className="flex gap-4">
                        <Button onClick={handleApply} className="flex-1 shadow-[var(--glow)]">
                          Submit Application
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center font-medium">
                      You have already applied for this role. Check the Applications tab for updates.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
