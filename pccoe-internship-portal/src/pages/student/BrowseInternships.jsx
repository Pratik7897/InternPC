import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, DollarSign, Briefcase, X, ChevronRight, RefreshCw, EyeOff, Eye, Mail, ExternalLink, AlertCircle } from 'lucide-react'
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
  const HIDDEN_KEY = `hidden_internships_${user?.id}`
  
  const [portalJobs, setPortalJobs] = useState([])
  const [gmailJobs, setGmailJobs] = useState([])
  const [hiddenJobs, setHiddenJobs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')) }
    catch { return new Set() }
  })
  
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [selectedJob, setSelectedJob] = useState(null)
  const [coverNote, setCoverNote] = useState('')
  const [isLoadingPortal, setIsLoadingPortal] = useState(true)
  const [isLoadingGmail, setIsLoadingGmail] = useState(false)
  const [gmailScopeMissing, setGmailScopeMissing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'portal' | 'gmail' | 'hidden'

  const fetchPortalInternships = useCallback(async () => {
    if (!user) return
    setIsLoadingPortal(true)
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('internships')
        .select('*')
        .neq('is_active', false)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      const { data: appliedData } = await supabase
        .from('applications')
        .select('internship_id')
        .eq('student_id', user.id)

      setAppliedJobs(new Set((appliedData || []).map(app => app.internship_id)))
      setPortalJobs(jobsData || [])
    } catch (error) {
      toast.error('Failed to load portal internships.')
      console.error('[BrowseInternships] Portal Error:', error)
    } finally {
      setIsLoadingPortal(false)
    }
  }, [user])

  const fetchGmail = useCallback(async (token) => {
    if (!token) return
    setIsLoadingGmail(true)
    setGmailScopeMissing(false)
    try {
      const result = await fetchGmailInternships(token)
      if (result && result.error === 'INSIGHT_SCOPE_MISSING') {
        console.warn('[Gmail] Scopes missing, prompted user to re-link.')
        setGmailScopeMissing(true)
        setGmailJobs([])
      } else {
        setGmailJobs(result || [])
      }
    } catch (err) {
      console.error('[Gmail] Error fetching internships:', err)
    } finally {
      setIsLoadingGmail(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPortalInternships()
      const token = providerToken || localStorage.getItem('gmail_provider_token')
      if (token) fetchGmail(token)
    }
  }, [user?.id, fetchPortalInternships, fetchGmail, providerToken])

  const handleRefresh = async () => {
    await fetchPortalInternships()
    const token = providerToken || localStorage.getItem('gmail_provider_token')
    if (token) await fetchGmail(token)
    else toast('No Gmail token — sign out and re-login with Google to enable Gmail sync.', { icon: 'ℹ️' })
  }

  const handleConnectGmail = async () => {
    const { signInWithOAuth } = useAuthStore.getState()
    toast.loading('Redirecting to Google for Gmail access...')
    const res = await signInWithOAuth('google', {
      scopes: 'email profile openid https://www.googleapis.com/auth/gmail.readonly'
    })
    if (res && res.error) {
      toast.error(res.error)
    }
  }

  const handleCoverNoteChange = (e) => {
    const val = e.target.value
    setCoverNote(val)
    if (val.trim()) {
      if (!localStorage.getItem('internship_app_started')) {
        localStorage.setItem('internship_app_started', Date.now().toString())
      }
    } else {
      localStorage.removeItem('internship_app_started')
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

  const hideJob = (e, jobId) => {
    e.stopPropagation()
    const updated = new Set([...hiddenJobs, jobId])
    setHiddenJobs(updated)
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...updated]))
    toast('Internship hidden. You can restore it anytime.', { icon: '🙈' })
  }

  const restoreJob = (e, jobId) => {
    e.stopPropagation()
    const updated = new Set(hiddenJobs)
    updated.delete(jobId)
    setHiddenJobs(updated)
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...updated]))
    toast.success('Internship restored!')
  }

  const unhideAll = () => {
    setHiddenJobs(new Set())
    localStorage.removeItem(HIDDEN_KEY)
    setActiveFilter('all')
    toast.success('All hidden internships restored!')
  }

  // All jobs combined (portal + gmail), excluding hidden ones
  const allJobs = [...portalJobs, ...gmailJobs]
  const visibleJobs = allJobs.filter(job => !hiddenJobs.has(job.id))
  const hiddenJobsList = allJobs.filter(job => hiddenJobs.has(job.id))

  const getFilteredList = () => {
    if (activeFilter === 'hidden') return hiddenJobsList
    if (activeFilter === 'portal') return portalJobs.filter(job => !hiddenJobs.has(job.id))
    if (activeFilter === 'gmail') return gmailJobs.filter(job => !hiddenJobs.has(job.id))
    return visibleJobs // 'all'
  }

  const filteredInternships = getFilteredList().filter(job => {
    const q = search.toLowerCase()
    return (
      job.title?.toLowerCase().includes(q) ||
      job.company_name?.toLowerCase().includes(q)
    )
  })

  const isLoading = isLoadingPortal
  const hasToken = !!(providerToken || localStorage.getItem('gmail_provider_token'))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Browse Internships</h1>
          <p className="text-text-secondary mt-1">
            Discover opportunities from the portal{hasToken ? ' and your Gmail inbox' : ''}.
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
            onClick={handleRefresh}
            disabled={isLoadingPortal || isLoadingGmail}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoadingPortal || isLoadingGmail) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {gmailScopeMissing && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Gmail Sync is currently limited. Please re-authenticate to enable full internship discovery.</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleConnectGmail} 
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Update Permissions
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: `All (${visibleJobs.length})` },
            { key: 'portal', label: `Portal (${portalJobs.filter(j => !hiddenJobs.has(j.id)).length})` },
            ...(hasToken ? [{ key: 'gmail', label: `Gmail${isLoadingGmail ? ' ⟳' : ` (${gmailJobs.filter(j => !hiddenJobs.has(j.id)).length})`}` }] : []),
            ...(hiddenJobs.size > 0 ? [{ key: 'hidden', label: `Hidden (${hiddenJobs.size})` }] : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === tab.key
                  ? tab.key === 'hidden'
                    ? 'bg-white/20 text-white'
                    : tab.key === 'gmail'
                      ? 'bg-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-accent-blue text-white shadow-[var(--glow)]'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {hiddenJobs.size > 0 && (
          <button
            onClick={unhideAll}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5"
          >
            <Eye className="w-3.5 h-3.5" />
            Restore all hidden
          </button>
        )}
      </div>

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
              {search
                ? `No results for "${search}"`
                : activeFilter === 'hidden'
                  ? 'No hidden internships.'
                  : activeFilter === 'gmail'
                    ? isLoadingGmail ? 'Loading Gmail internships...' : 'No internship emails found in your Gmail inbox.'
                    : 'No internships available right now.'}
            </p>
          </div>
        ) : (
          filteredInternships.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`glass-card p-6 flex flex-col cursor-pointer border hover:border-accent-blue/50 transition-all duration-200 group relative ${
                job.is_gmail ? 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              }`}
              onClick={() => setSelectedJob(job)}
            >
              {job.is_gmail && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0 rounded-t-xl" />
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=1e3a5f&color=60a5fa&bold=true`}
                    alt={job.company_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  {job.is_gmail && (
                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Gmail
                    </Badge>
                  )}
                  {activeFilter !== 'hidden' && (
                    <button
                      onClick={(e) => hideJob(e, job.id)}
                      title="Hide"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors border border-white/10 hover:border-red-500/30"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {appliedJobs.has(job.id) && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Applied ✓</Badge>
                  )}
                  {activeFilter === 'hidden' && (
                    <button
                      onClick={(e) => restoreJob(e, job.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-text-secondary hover:text-emerald-400 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-heading font-bold mb-1 group-hover:text-accent-blue transition-colors line-clamp-2">{job.title}</h3>
              <p className="text-accent-blue font-medium text-sm mb-4">{job.company_name}</p>

              <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-4">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent-blue/70" />
                    {job.location}
                  </span>
                )}
                {job.stipend && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-accent-teal/70" />
                    {job.stipend}
                  </span>
                )}
              </div>

              <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  Deadline: {job.deadline || '—'}
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
                  {selectedJob.is_gmail ? 'Gmail Internship' : 'Internship Details'}
                </h3>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-5">
                   <div className="w-16 h-16 bg-white/10 rounded-xl p-2 shrink-0 border border-white/10 flex items-center justify-center">
                    <img src={selectedJob.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company_name || 'C')}`} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-heading">{selectedJob.title}</h2>
                    <p className="text-accent-blue text-lg">{selectedJob.company_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass rounded-xl">
                  <div><p className="text-xs text-text-secondary mb-1">Stipend</p><p className="text-sm">{selectedJob.stipend || '—'}</p></div>
                  <div><p className="text-xs text-text-secondary mb-1">Duration</p><p className="text-sm">{selectedJob.duration || '—'}</p></div>
                  <div><p className="text-xs text-text-secondary mb-1">Location</p><p className="text-sm">{selectedJob.location || '—'}</p></div>
                  <div><p className="text-xs text-text-secondary mb-1">Deadline</p><p className="text-sm">{selectedJob.deadline || '—'}</p></div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">Description</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="border-t border-white/10 pt-6 mt-6">
                  {selectedJob.is_gmail ? (
                    <div className="flex gap-3">
                      {selectedJob.has_apply_link && (
                        <Button onClick={() => window.open(selectedJob.apply_link, '_blank')} className="flex-1 shadow-[var(--glow)]">Apply Directly</Button>
                      )}
                      <Button variant="outline" onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${selectedJob.id.replace('gmail-', '')}`, '_blank')} className="flex-1">Open in Gmail</Button>
                    </div>
                  ) : !appliedJobs.has(selectedJob.id) ? (
                    <>
                      <h3 className="text-lg font-bold mb-3">Apply Now</h3>
                      <textarea
                        value={coverNote}
                        onChange={handleCoverNoteChange}
                        placeholder="Why are you a good fit?"
                        className="w-full h-24 rounded-lg bg-white/5 border border-white/10 p-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none resize-none mb-4"
                      ></textarea>
                      <div className="flex gap-4">
                        <Button onClick={handleApply} className="flex-1 shadow-[var(--glow)]">Submit Application</Button>
                        <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center">Already Applied ✓</div>
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
