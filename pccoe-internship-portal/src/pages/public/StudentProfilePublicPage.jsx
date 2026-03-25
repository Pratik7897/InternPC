import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, ExternalLink, Download, PlayCircle, Award, BookOpen, Briefcase, GitBranch, Globe, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Footer from '../../components/layout/Footer'

// Mock Student Data
const student = {
  id: 'uuid-1',
  name: 'Aisha Sharma',
  branch: 'Computer Science',
  year: 'BE',
  cgpa: 9.2,
  photo: 'https://i.pravatar.cc/150?u=1',
  about: "I am a passionate computer science student with a strong foundation in modern web technologies and a keen interest in building scalable, user-centric applications. Looking for a challenging internship to apply my skills and grow as an engineer.",
  email: 'aisha.sharma22@pccoepune.org',
  linkedin: 'https://linkedin.com/in/aishasharma',
  github: 'https://github.com/aishasharma',
  portfolio: 'https://aisha.dev',
  techSkills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind CSS', 'Docker'],
  softSkills: ['Team Leadership', 'Problem Solving', 'Public Speaking', 'Agile Methodology'],
  projects: [
    {
      title: 'EduConnect Platform',
      description: 'A full-stack learning management system built for local schools to manage assignments and virtual classes.',
      tech: ['Next.js', 'Firebase', 'Tailwind'],
      github: '#',
      live: '#'
    },
    {
      title: 'Smart Health API',
      description: 'RESTful API service for processing and analyzing patient vital data with predictive ML models.',
      tech: ['Python', 'FastAPI', 'Pandas', 'PostgreSQL'],
      github: '#',
      live: ''
    }
  ],
  experience: [
    {
      role: 'Frontend Developer Intern',
      company: 'TechFlow Solutions',
      duration: 'Summer 2025',
      description: 'Developed interactive dashboards using React and Redux. Improved application load times by 25% through code splitting.'
    }
  ],
  certificates: [
    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
    { name: 'Advanced React Patterns', issuer: 'Frontend Masters' }
  ]
}

export default function StudentProfilePublicPage() {
  const { student_id } = useParams()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 w-full mt-8 flex-1">
        
        <Link to="/directory" className="inline-flex items-center text-sm mb-8 text-text-secondary hover:text-accent-blue transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Directory
        </Link>

        {/* Header Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <img src={student.photo} alt={student.name} className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white/10 shadow-2xl" />
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-2">{student.name}</h1>
                  <p className="text-lg text-text-secondary">{student.year} • {student.branch}</p>
                </div>
                <Badge variant="secondary" className="w-fit text-lg px-4 py-2 bg-accent-blue/10 text-accent-blue border-accent-blue/20">
                  {student.cgpa} CGPA
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <Button size="sm" variant="secondary" asChild className="gap-2">
                  <a href={`mailto:${student.email}`}><Mail className="w-4 h-4" /> Email</a>
                </Button>
                <Button size="sm" variant="secondary" asChild className="gap-2 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 border-[#0A66C2]/20">
                  <a href={student.linkedin} target="_blank" rel="noreferrer"><Globe className="w-4 h-4" /> LinkedIn</a>
                </Button>
                <Button size="sm" variant="secondary" asChild className="gap-2 relative bg-white/5 hover:bg-white/10">
                  <a href={student.github} target="_blank" rel="noreferrer"><GitBranch className="w-4 h-4" /> GitHub</a>
                </Button>
                {student.portfolio && (
                  <Button size="sm" variant="secondary" asChild className="gap-2">
                    <a href={student.portfolio} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> Portfolio</a>
                  </Button>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button className="gap-2 shadow-[var(--glow)]">
                  <Download className="w-4 h-4" /> Preview Resume
                </Button>
                <Button variant="outline" className="gap-2 glass">
                  <PlayCircle className="w-4 h-4 text-accent-teal" /> Watch Intro
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-2xl"
            >
              <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-accent-blue" /> About Me
              </h2>
              <p className="text-text-secondary leading-relaxed">{student.about}</p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-8 rounded-2xl"
            >
              <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent-gold" /> Experience
              </h2>
              <div className="space-y-6">
                {student.experience.map((exp, i) => (
                  <div key={i} className="border-l-2 border-accent-gold/30 pl-6 relative">
                    <div className="absolute w-3 h-3 bg-accent-gold rounded-full -left-[7px] top-1.5 ring-4 ring-background"></div>
                    <h3 className="text-lg font-bold text-text-primary">{exp.role}</h3>
                    <p className="text-accent-gold text-sm font-medium mb-2">{exp.company} • {exp.duration}</p>
                    <p className="text-text-secondary text-sm">{exp.description}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass p-8 rounded-2xl"
            >
              <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-blue" /> Key Projects
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {student.projects.map((proj, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-text-primary">{proj.title}</h3>
                      <div className="flex gap-2">
                        {proj.github && <a href={proj.github} className="text-text-secondary hover:text-white"><GitBranch className="w-5 h-5" /></a>}
                        {proj.live && <a href={proj.live} className="text-text-secondary hover:text-white"><ExternalLink className="w-5 h-5" /></a>}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-4">{proj.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {proj.tech.map(t => <Badge key={t} variant="outline" className="text-xs bg-black/20 border-white/5">{t}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 md:p-8 rounded-2xl"
            >
              <h2 className="text-lg font-heading font-bold mb-4">Technical Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.techSkills.map(skill => (
                  <Badge key={skill} className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20">{skill}</Badge>
                ))}
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 md:p-8 rounded-2xl"
            >
              <h2 className="text-lg font-heading font-bold mb-4">Soft Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.softSkills.map(skill => (
                  <Badge key={skill} variant="outline" className="border-white/10 text-text-primary">{skill}</Badge>
                ))}
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass p-6 md:p-8 rounded-2xl"
            >
              <h2 className="text-lg font-heading font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-teal" /> Certifications
              </h2>
              <div className="space-y-4">
                {student.certificates.map((cert, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{cert.name}</span>
                    <span className="text-xs text-text-secondary">{cert.issuer}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  )
}
// Note: We need to import User from lucide-react above.
