import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Calendar, DollarSign, Briefcase, X, ChevronRight } from 'lucide-react'
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

  useEffect(() => {
    fetchInternships()
  }, [])

  const fetchInternships = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch active internships from Supabase
      const { data: jobsData, error: jobsError } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (jobsError) throw jobsError

      // 2. Fetch student's applications to see which are "Applied"
      const { data: appliedData, error: appliedError } = await supabase
        .from('applications')
        .select('internship_id')
        .eq('student_id', user.id)
      
      if (appliedError) throw appliedError

      // 3. IF they have a providerToken from Google, fetch their Gmail opportunities!
      let gmailJobs = []
      if (providerToken) {
        gmailJobs = await fetchGmailInternships(providerToken)
      }

      // Combine both lists
      setInternships([...(jobsData || []), ...gmailJobs])
      setAppliedJobs(new Set(appliedData.map(app => app.internship_id)))
    } catch (error) {
      toast.error("Failed to load internships.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
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
    } catch (error) {
      toast.error(error.message || "Application failed.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Internships</h1>
          <p className="text-text-secondary mt-1">Discover and apply to top opportunities.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..." 
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <p className="text-text-secondary">Loading opportunities...</p>
        ) : internships.length === 0 ? (
          <p className="text-text-secondary">No active internships found.</p>
        ) : internships.filter(job => job.title.toLowerCase().includes(search.toLowerCase()) || job.company_name.toLowerCase().includes(search.toLowerCase())).map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex flex-col cursor-pointer border hover:border-accent-blue/50 transition-colors"
            onClick={() => setSelectedJob(job)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white rounded-lg p-1.5 shrink-0">
                <img src={job.company_logo_url || 'https://via.placeholder.com/150'} alt={job.company_name} className="w-full h-full object-contain" />
              </div>
              {appliedJobs.has(job.id) ? (
                <Badge className="bg-emerald-500/20 text-emerald-400">Applied ✓</Badge>
              ) : job.is_featured && (
                <Badge className="bg-accent-gold/20 text-accent-gold">Featured</Badge>
              )}
            </div>
            
            <h3 className="text-xl font-heading font-bold mb-1">{job.title}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-accent-blue font-medium">{job.company_name}</span>
              {job.is_gmail && <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] py-0">From Gmail</Badge>}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-6 flex-1">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location} ({job.work_mode})</span>
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {job.stipend}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.duration}</span>
            </div>
            
            <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
              <p className="text-xs text-text-secondary">Deadline: {job.deadline}</p>
              <span className="text-sm font-medium text-accent-blue flex items-center gap-1">View Details <ChevronRight className="w-4 h-4" /></span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal Overlay */}
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
                <h3 className="font-heading font-bold text-lg">Internship Details</h3>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-white rounded-xl p-2 shrink-0 border border-white/10">
                    <img src={selectedJob.company_logo_url || 'https://via.placeholder.com/150'} alt={selectedJob.company_name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-heading">{selectedJob.title}</h2>
                    <div className="flex items-center gap-2">
                       <p className="text-accent-blue text-lg">{selectedJob.company_name}</p>
                       {selectedJob.is_gmail && <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] py-0">Gmail Sourced</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass rounded-xl">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Stipend</p>
                    <p className="font-medium text-sm">{selectedJob.stipend}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Duration</p>
                    <p className="font-medium text-sm">{selectedJob.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Location</p>
                    <p className="font-medium text-sm">{selectedJob.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Deadline</p>
                    <p className="font-medium text-sm">{selectedJob.deadline}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">Description</h3>
                  <p className="text-text-secondary leading-relaxed">{selectedJob.description}</p>
                </div>

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

                {!appliedJobs.has(selectedJob.id) ? (
                  <div className="border-t border-white/10 pt-6 mt-6">
                    {selectedJob.is_gmail ? (
                       <>
                         <h3 className="text-lg font-bold mb-3">Apply via Gmail</h3>
                         <p className="text-sm text-text-secondary mb-4">This internship was sourced from your personal Gmail inbox. To apply or respond, you need to continue the thread in your email client.</p>
                         <div className="flex gap-4">
                           <Button onClick={() => window.open(selectedJob.apply_link, '_blank')} className="flex-1 shadow-[var(--glow)]">Open in Gmail</Button>
                           <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">Close</Button>
                         </div>
                       </>
                    ) : (
                       <>
                         <h3 className="text-lg font-bold mb-3">Apply for this role</h3>
                         <p className="text-sm text-text-secondary mb-3">Add a brief cover note (optional). Your profile, resume, and video will be shared automatically.</p>
                         <textarea 
                           value={coverNote}
                           onChange={e => setCoverNote(e.target.value)}
                           placeholder="Why are you a good fit?"
                           className="w-full h-24 rounded-lg bg-white/5 border border-white/10 p-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none resize-none mb-4"
                         ></textarea>
                         <div className="flex gap-4">
                           <Button onClick={handleApply} className="flex-1 shadow-[var(--glow)]">Submit Application</Button>
                           <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">Cancel</Button>
                         </div>
                       </>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-white/10 pt-6 mt-6">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center font-medium">
                      You have already applied for this role. Check the Applications tab for updates.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
// Note: Need ChevronRight from lucide-react
