import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, AlertCircle, FileText, Briefcase, Star, ArrowRight, Bell, Clock, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'



export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ applied: 0, shortlisted: 0, newInternships: 0 })
  const [featuredRoles, setFeaturedRoles] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (profileData) setProfile(profileData)
      if (!profileData && !profileError) {
         // Fallback if no profile exists yet
         setProfile({ full_name: user?.user_metadata?.full_name || 'Student', profile_completion: 0 })
      }

      // Fetch Applications Count
      const { data: appliedData } = await supabase.from('applications').select('id').eq('student_id', user.id)
      
      // Fetch Shortlisted/Interview/Selected Count
      const { data: shortData } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', user.id)
        .in('status', ['shortlisted', 'under_review', 'selected'])

      // Fetch Active Internships Count (includes null is_active since those are newly posted)
      const { data: activeData } = await supabase
        .from('internships')
        .select('id')
        .neq('is_active', false)

      // Fetch featured roles for the dashboard widget
      const { data: featuredData } = await supabase
        .from('internships')
        .select('id, title, company_name, location, work_mode')
        .eq('is_featured', true)
        .neq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(3)

      setFeaturedRoles(featuredData || [])

      // Fetch latest announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, type, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setAnnouncements(announcementsData || [])

      setStats({
        applied: appliedData?.length || 0,
        shortlisted: shortData?.length || 0,
        newInternships: activeData?.length || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const completionPercentage = profile?.profile_completion || 0

  const dynamicProfileSteps = [
    { id: 1, label: 'Basic Information', completed: !!(profile?.full_name && profile?.phone && profile?.date_of_birth && profile?.gender), link: '/student/profile' },
    { id: 2, label: 'Academic Details', completed: !!(profile?.prn_number && profile?.branch && profile?.current_year && profile?.cgpa), link: '/student/profile' },
    { id: 3, label: 'Skills & Experience', completed: !!(profile?.technical_skills?.length > 0), link: '/student/profile' },
    { id: 4, label: 'Upload Documents', completed: !!profile?.resume_url, link: '/student/upload' }
  ]

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-6 z-10 w-full md:w-auto">
          <img src={profile?.profile_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'Student'}&background=random`} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">Welcome, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Student'}!</h1>
            <p className="text-text-secondary mt-1 max-w-sm">Ready to land your dream internship? Complete your profile to get noticed.</p>
          </div>
        </div>
        <div className="z-10 w-full md:w-auto">
          <Button asChild className="w-full md:w-auto shadow-[var(--glow)]">
            <Link to="/student/internships">Browse Internships</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Completion Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex flex-col h-full"
        >
          <h2 className="text-xl font-heading font-bold mb-6 flex items-center justify-between">
            Profile Status
            <span className="text-accent-blue">{completionPercentage}%</span>
          </h2>
          
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-accent-blue transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray={`${completionPercentage}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-text-primary">{completionPercentage}%</span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {dynamicProfileSteps.map(step => (
              <div key={step.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-accent-teal" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-secondary" />
                  )}
                  <span className={step.completed ? 'text-text-primary' : 'text-text-secondary'}>{step.label}</span>
                </div>
                {!step.completed && (
                  <Link to={step.link} className="text-accent-blue hover:underline text-xs font-medium">Complete</Link>
                )}
              </div>
            ))}
          </div>
          
          {completionPercentage < 100 && (
            <div className="mt-6 p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-lg flex items-start gap-3 text-sm text-accent-gold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Companies prioritize fully completed profiles. Finish your setup!</p>
            </div>
          )}
        </motion.div>

          {/* Stats Row */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3"><FileText className="w-5 h-5" /></div>
              <p className="text-sm text-text-secondary font-medium">Applications Sent</p>
              <h3 className="text-2xl font-bold mt-1">{stats.applied}</h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
              <div className="w-10 h-10 rounded-lg bg-accent-gold/20 text-accent-gold flex items-center justify-center mb-3"><Star className="w-5 h-5" /></div>
              <p className="text-sm text-text-secondary font-medium">Shortlisted/Interview</p>
              <h3 className="text-2xl font-bold mt-1">{stats.shortlisted}</h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-card p-5">
              <div className="w-10 h-10 rounded-lg bg-accent-teal/20 text-accent-teal flex items-center justify-center mb-3"><Briefcase className="w-5 h-5" /></div>
              <p className="text-sm text-text-secondary font-medium">Open Internships</p>
              <h3 className="text-2xl font-bold mt-1">{stats.newInternships}</h3>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 flex-1">
            {/* Quick Apply / Featured */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 flex flex-col">
              <h2 className="text-lg font-heading font-bold mb-4 flex items-center justify-between">
                <span>Featured Roles</span>
                <Link to="/student/internships" className="text-xs text-accent-blue font-medium hover:underline flex items-center">View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </h2>
              <div className="space-y-3 flex-1">
                {featuredRoles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <Briefcase className="w-8 h-8 text-text-secondary/30 mb-2" />
                    <p className="text-text-secondary text-sm">No featured internships yet.</p>
                    <Link to="/student/internships" className="text-xs text-accent-blue mt-1 hover:underline">Browse all listings</Link>
                  </div>
                ) : (
                  featuredRoles.map(role => (
                    <Link
                      key={role.id}
                      to="/student/internships"
                      className="group p-3 border border-white/5 bg-white/5 rounded-xl hover:border-accent-blue/30 hover:bg-white/10 transition-all flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium text-sm text-text-primary">{role.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{role.company_name}{role.location ? ` • ${role.location}` : ''}</p>
                      </div>
                      <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-accent-gold/10 text-accent-gold border-accent-gold/30">⭐ Featured</Badge>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>

            {/* Timeline & Announcements */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 flex flex-col">
              <h2 className="text-lg font-heading font-bold mb-4 flex items-center justify-between">
                <span>Recent Updates</span>
              </h2>
              <div className="space-y-4 flex-1">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <Bell className="w-8 h-8 text-text-secondary/30 mb-2" />
                    <p className="text-text-secondary text-sm">No announcements yet.</p>
                  </div>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="flex gap-4">
                      <div className="mt-1">
                        {ann.type === 'urgent' ? 
                          <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> : 
                          <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                        }
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-text-primary leading-tight">{ann.title}</h4>
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/student/notifications" className="block text-center text-xs text-text-secondary hover:text-white pt-4 mt-auto border-t border-white/5">View all notifications</Link>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
