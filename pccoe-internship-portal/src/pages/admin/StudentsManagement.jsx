import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Download, MoreVertical, X, Eye, ShieldAlert, Mail, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function StudentsManagement() {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.prn_number?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDeactivate = () => {
    toast.success('Wait! Account suspension requires direct auth API access.')
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Student Roster</h1>
          <p className="text-text-secondary mt-1">Manage and verify registered students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PRN or Name..." 
              className="pl-9 h-10"
            />
          </div>
          <Button variant="outline" className="gap-2 shrink-0 glass"><Filter className="w-4 h-4"/> Filters</Button>
          <Button variant="secondary" className="gap-2 shrink-0"><Download className="w-4 h-4"/> Export</Button>
        </div>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col relative rounded-xl border border-white/10">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-text-secondary sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">PRN Number</th>
                <th className="p-4 font-medium">Branch / Year</th>
                <th className="p-4 font-medium">CGPA</th>
                <th className="p-4 font-medium">Profile %</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="7" className="p-8 text-center text-text-secondary">Loading student profiles...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-text-secondary">No students found.</td></tr>
              ) : filteredStudents.map((sys, i) => (
                <motion.tr 
                  key={sys.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs uppercase">
                        {sys.full_name ? sys.full_name.charAt(0) : '?'}
                      </div>
                      <span className="font-heading font-semibold text-text-primary">{sys.full_name || 'No Name Set'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-text-secondary font-mono">{sys.prn_number || 'N/A'}</td>
                  <td className="p-4 text-text-secondary">{sys.branch || 'N/A'} • {sys.current_year || 'N/A'}</td>
                  <td className="p-4 font-medium text-accent-gold">{sys.cgpa || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-white/10 rounded-full h-1.5 max-w-[60px]">
                        <div className="bg-accent-blue h-1.5 rounded-full" style={{ width: `${sys.profile_completion || 0}%` }}></div>
                      </div>
                      <span className="text-xs text-text-secondary">{sys.profile_completion || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">Active</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button size="sm" variant="ghost" className="h-8 shadow-none" onClick={() => setSelectedStudent(sys)}>
                      Inspect <ChevronRightIcon className="w-4 h-4 ml-1 opacity-50"/>
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Drawer/Overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            ></motion.div>
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-secondary/95 border-l border-white/20 shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-heading font-bold text-text-primary">Student Inspection</h2>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-4xl mb-4 border-2 border-accent-blue/30 shadow-[var(--glow)]">
                    {selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3 className="text-2xl font-bold font-heading">{selectedStudent.full_name || 'Anonymous User'}</h3>
                  <p className="text-text-secondary font-mono mt-1">{selectedStudent.prn_number || 'No PRN'}</p>
                  <p className="text-text-secondary font-mono mt-1 text-xs">{selectedStudent.email}</p>
                  <div className="flex gap-2 mt-3">
                     <Badge className="bg-white/5 pointer-events-none">{selectedStudent.branch || 'No Branch'}</Badge>
                     <Badge className="bg-white/5 pointer-events-none">{selectedStudent.current_year || 'No Year'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-text-secondary mb-1">CGPA</p>
                    <p className="text-lg font-bold text-accent-gold">{selectedStudent.cgpa || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-text-secondary mb-1">Profile Completion</p>
                    <p className="text-lg font-bold text-accent-blue">{selectedStudent.profile_completion || 0}%</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-3">Documents</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={() => selectedStudent.resume_url ? window.open(selectedStudent.resume_url, '_blank') : toast.error('No Resume uploaded')}
                      className="w-full justify-between glass h-12"
                      disabled={!selectedStudent.resume_url}
                    >
                      <span className="flex items-center gap-2"><Eye className="w-4 h-4"/> View Resume.pdf</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => selectedStudent.intro_video_url ? window.open(selectedStudent.intro_video_url, '_blank') : toast.error('No Video uploaded')}
                      className="w-full justify-between glass h-12"
                      disabled={!selectedStudent.intro_video_url}
                    >
                      <span className="flex items-center gap-2"><Eye className="w-4 h-4"/> View Intro Video</span>
                    </Button>
                  </div>
                </div>

              </div>
              
              <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                <Button className="flex-1 gap-2" onClick={() => window.open(`mailto:${selectedStudent.email}`, '_blank')}><Mail className="w-4 h-4"/> Email Student</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChevronRightIcon({className}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
}
