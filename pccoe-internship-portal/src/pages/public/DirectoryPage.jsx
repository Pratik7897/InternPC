import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronDown, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import Footer from '../../components/layout/Footer'

// Mock Data
const mockStudents = [
  {
    id: 'uuid-1',
    name: 'Aisha Sharma',
    branch: 'Computer Science',
    year: 'BE',
    cgpa: 9.2,
    skills: ['React', 'Node.js', 'Python'],
    photo: 'https://i.pravatar.cc/150?u=1',
  },
  {
    id: 'uuid-2',
    name: 'Rahul Verma',
    branch: 'Information Tech',
    year: 'TE',
    cgpa: 8.7,
    skills: ['Java', 'Spring Boot', 'SQL'],
    photo: 'https://i.pravatar.cc/150?u=2',
  },
  {
    id: 'uuid-3',
    name: 'Priya Patel',
    branch: 'EN&TC',
    year: 'BE',
    cgpa: 9.5,
    skills: ['C++', 'Embedded Systems', 'IoT'],
    photo: 'https://i.pravatar.cc/150?u=3',
  },
  {
    id: 'uuid-4',
    name: 'Amit Kumar',
    branch: 'AI & Data Science',
    year: 'TE',
    cgpa: 8.9,
    skills: ['Machine Learning', 'Python', 'TensorFlow'],
    photo: 'https://i.pravatar.cc/150?u=4',
  }
]

export default function DirectoryPage() {
  const [search, setSearch] = useState('')

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
              Filters
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-text-secondary font-semibold">Branch</Label>
                <div className="space-y-2">
                  {['Computer Science', 'Information Tech', 'EN&TC', 'AI & Data Science'].map(branch => (
                    <label key={branch} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue focus:ring-offset-background" />
                      <span className="text-sm group-hover:text-text-primary transition-colors">{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-text-secondary font-semibold">Year of Study</Label>
                <div className="flex flex-wrap gap-2">
                  {['FE', 'SE', 'TE', 'BE'].map(year => (
                    <Badge key={year} variant="outline" className="cursor-pointer hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-colors">
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-text-secondary font-semibold">Minimum CGPA</Label>
                <Input type="range" min="5" max="10" step="0.1" defaultValue="7" className="p-0 border-0 bg-transparent h-auto" />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>5.0</span>
                  <span>10.0</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Has Resume</span>
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue focus:ring-offset-background" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Has Video Intro</span>
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-blue focus:ring-accent-blue focus:ring-offset-background" />
                </label>
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
              placeholder="Search by name, skills, or PRN..." 
              className="pl-12 h-14 bg-secondary/50 backdrop-blur-md border-white/10 text-lg rounded-xl shadow-lg w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockStudents.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card flex flex-col overflow-hidden group"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <img 
                      src={student.photo} 
                      alt={student.name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:border-accent-blue/50 transition-colors"
                    />
                    <Badge variant="secondary" className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                      {student.cgpa} CGPA
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-1">{student.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                    <span className="text-accent-gold font-medium">{student.year}</span>
                    <span>•</span>
                    <span>{student.branch}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {student.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="bg-white/5 border-white/10 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {student.skills.length > 3 && (
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">+{student.skills.length - 3}</Badge>
                    )}
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
        </div>
      </div>
      <Footer />
    </div>
  )
}
