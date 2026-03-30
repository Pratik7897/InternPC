import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import Footer from '../../components/layout/Footer'
import { supabase } from '../../lib/supabase'

export default function DirectoryPage() {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, branch, current_year, cgpa, technical_skills, profile_photo_url, resume_url, intro_video_url')
        .eq('is_profile_public', true)
        .eq('is_active', true)
        .order('cgpa', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.branch?.toLowerCase().includes(search.toLowerCase()) ||
    s.technical_skills?.some(sk => sk.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Directory Header */}
      <div className="bg-secondary/30 mt-16 py-16 px-6 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">PCCOE Student Talent Pool</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">Discover and connect with skilled students from PCCOE ready for their next internship opportunity.</p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-xl font-heading font-bold text-text-primary">
              <Filter className="w-5 h-5 text-accent-blue" />
              Info
            </div>
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
                <p className="font-medium text-accent-blue mb-1">For Recruiters</p>
                <p>Browse student profiles, download resumes, and watch intro videos directly.</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <p className="font-medium text-text-primary mb-1">Total Students</p>
                <p className="text-2xl font-bold text-text-primary">{students.length}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <p className="font-medium text-text-primary mb-1">With Resume</p>
                <p className="text-2xl font-bold text-accent-teal">{students.filter(s => s.resume_url).length}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <p className="font-medium text-text-primary mb-1">With Video</p>
                <p className="text-2xl font-bold text-accent-gold">{students.filter(s => s.intro_video_url).length}</p>
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
              placeholder="Search by name, branch, or skills..." 
              className="pl-12 h-14 bg-secondary/50 backdrop-blur-md border-white/10 text-lg rounded-xl shadow-lg w-full"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-10 h-10 animate-spin text-accent-blue" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <p className="text-lg">No students found{search ? ` for "${search}"` : ''}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass-card flex flex-col overflow-hidden group"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <img 
                        src={student.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'S')}&background=random`}
                        alt={student.full_name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:border-accent-blue/50 transition-colors"
                      />
                      {student.cgpa && (
                        <Badge variant="secondary" className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                          {student.cgpa} CGPA
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-heading font-bold text-text-primary mb-1">{student.full_name || 'Student'}</h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                      {student.current_year && <span className="text-accent-gold font-medium">{student.current_year}</span>}
                      {student.current_year && student.branch && <span>•</span>}
                      {student.branch && <span>{student.branch}</span>}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto mb-3">
                      {(student.technical_skills || []).slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="bg-white/5 border-white/10 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(student.technical_skills || []).length > 3 && (
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">+{student.technical_skills.length - 3}</Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-1">
                      {student.resume_url && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">Has Resume</Badge>}
                      {student.intro_video_url && <Badge className="bg-accent-teal/10 text-accent-teal border-0 text-[10px]">Has Video</Badge>}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                    <Button asChild className="w-full relative overflow-hidden group/btn">
                      <Link to={`/directory/${student.id}`}>
                        <span className="relative z-10">View Profile</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue to-accent-teal opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      </Link>
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
