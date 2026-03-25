import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Calendar, DollarSign, Building } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import Footer from '../../components/layout/Footer'

// Mock Data
const mockInternships = [
  {
    id: 'int-1',
    title: 'Software Engineering Intern',
    company: 'TechFlow Solutions',
    logo: 'https://logo.clearbit.com/google.com',
    location: 'Pune, India',
    mode: 'Hybrid',
    stipend: '₹25,000 / month',
    duration: '6 Months',
    deadline: 'Oct 30, 2026',
    featured: true
  },
  {
    id: 'int-2',
    title: 'Data Science Intern',
    company: 'Analytics Corp',
    logo: 'https://logo.clearbit.com/facebook.com',
    location: 'Remote',
    mode: 'Remote',
    stipend: '₹30,000 / month',
    duration: '3 Months',
    deadline: 'Nov 15, 2026',
    featured: false
  },
  {
    id: 'int-3',
    title: 'Frontend Developer',
    company: 'Creative Studio',
    logo: 'https://logo.clearbit.com/apple.com',
    location: 'Mumbai, India',
    mode: 'Onsite',
    stipend: '₹20,000 / month',
    duration: '6 Months',
    deadline: 'Nov 01, 2026',
    featured: true
  }
]

export default function InternshipsPublicPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-secondary/30 mt-16 py-16 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Latest Opportunities</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">Explore exclusive internships curated for PCCOE students by top structural and technical recruiters.</p>
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
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue focus:ring-offset-background" />
                      <span className="text-sm group-hover:text-text-primary transition-colors">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-text-secondary font-semibold">Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {['< 3 Months', '3 Months', '6 Months', '> 6 Months'].map(time => (
                    <Badge key={time} variant="outline" className="cursor-pointer hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-colors">
                      {time}
                    </Badge>
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

          <div className="space-y-4">
            {mockInternships.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center group"
              >
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-2 shrink-0 border border-white/10">
                  <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-heading font-bold text-text-primary truncate">{job.title}</h3>
                    {job.featured && <Badge className="bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30">Hot</Badge>}
                  </div>
                  <div className="text-lg text-accent-blue mb-3">{job.company}</div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location} ({job.mode})</span>
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {job.stipend}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {job.duration}</span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0 shrink-0 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                  <div className="text-xs text-text-secondary">Deadline: <span className="text-text-primary">{job.deadline}</span></div>
                  <Button asChild className="w-full md:w-auto shadow-[var(--glow)]">
                    <Link to="/login">Login to Apply</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
