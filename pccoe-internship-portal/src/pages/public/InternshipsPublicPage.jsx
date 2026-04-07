import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Calendar, DollarSign, Briefcase, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import Footer from '../../components/layout/Footer'
import { supabase } from '../../lib/supabase'

export default function InternshipsPublicPage() {
  const [search, setSearch] = useState('')
  const [internships, setInternships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [workModeFilter, setWorkModeFilter] = useState([])

  useEffect(() => {
    fetchInternships()
  }, [])

  const fetchInternships = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('id, title, company_name, company_logo_url, location, work_mode, stipend, duration, deadline, is_featured')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      setInternships(data || [])
    } catch (err) {
      console.error('Public internships fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = (mode) => {
    setWorkModeFilter(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  const filtered = internships.filter(job => {
    const q = search.toLowerCase()
    const matchSearch = job.title?.toLowerCase().includes(q) || job.company_name?.toLowerCase().includes(q)
    const matchMode = workModeFilter.length === 0 || workModeFilter.includes(job.work_mode)
    return matchSearch && matchMode
  })

  const formatDeadline = (d) => {
    if (!d) return 'Open'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-secondary/30 mt-16 py-16 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Latest Opportunities</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Explore exclusive internships curated for PCCOE students by top recruiters.
          </p>
          {!isLoading && (
            <p className="text-sm text-accent-blue mt-3 font-medium">{internships.length} active listings</p>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col lg:flex-row gap-8">

        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-xl font-heading font-bold text-text-primary">
              <Filter className="w-5 h-5 text-accent-blue" />
              Filters
            </div>
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-text-secondary font-semibold">Work Mode</Label>
                <div className="space-y-2">
                  {['Remote', 'Onsite', 'Hybrid'].map(mode => (
                    <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={workModeFilter.includes(mode)}
                        onChange={() => toggleMode(mode)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue focus:ring-offset-background"
                      />
                      <span className="text-sm group-hover:text-text-primary transition-colors">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies, keywords..."
              className="pl-12 h-14 bg-secondary/50 backdrop-blur-md border-white/10 text-lg rounded-xl shadow-lg w-full"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Briefcase className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
              <p className="text-text-secondary text-lg">
                {search ? `No results for "${search}"` : 'No active internships right now.'}
              </p>
              <p className="text-text-secondary text-sm mt-2">Check back soon or log in to see all listings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center group"
                >
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center p-2 shrink-0 border border-white/10 overflow-hidden">
                    <img
                      src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=1e3a5f&color=60a5fa&bold=true&size=128`}
                      alt={job.company_name}
                      className="w-full h-full object-contain"
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((job.company_name || 'C').charAt(0))}&background=1e3a5f&color=60a5fa&bold=true` }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-heading font-bold text-text-primary truncate">{job.title}</h3>
                      {job.is_featured && <Badge className="bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30">⭐ Featured</Badge>}
                    </div>
                    <div className="text-lg text-accent-blue mb-3">{job.company_name}</div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
                      {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}{job.work_mode && ` (${job.work_mode})`}</span>}
                      {job.stipend && <span className="flex items-center gap-1.5"><span className="text-accent-teal font-bold">₹</span> {job.stipend}</span>}
                      {job.duration && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {job.duration}</span>}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0 shrink-0 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                    <div className="text-xs text-text-secondary">Deadline: <span className="text-text-primary">{formatDeadline(job.deadline)}</span></div>
                    <Button asChild className="w-full md:w-auto shadow-[var(--glow)]">
                      <Link to="/login">Login to Apply</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
