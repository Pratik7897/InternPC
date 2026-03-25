import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { motion } from 'framer-motion'
import { Users, Briefcase, FileCheck, Award, Plus, Mail, Megaphone, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Fallback Mock Data for charts if empty
const kpiData = [
  { title: 'Total Students', value: '4,521', icon: Users, color: 'text-blue-400' },
  { title: 'Profiles Complete', value: '82%', icon: FileCheck, color: 'text-emerald-400' },
  { title: 'Active Internships', value: '124', icon: Briefcase, color: 'text-accent-gold' },
  { title: 'Total Applications', value: '8,932', icon: FileCheck, color: 'text-purple-400' },
  { title: 'Students Placed', value: '3,105', icon: Award, color: 'text-accent-teal' }
]

const applicationsData = [
  { name: 'Google SWE', applications: 450 },
  { name: 'Amazon SDE', applications: 380 },
  { name: 'Microsoft UI', applications: 310 },
  { name: 'Meta Data', applications: 290 },
  { name: 'Apple iOS', applications: 210 },
]

const branchData = [
  { name: 'CSE', value: 1200 },
  { name: 'IT', value: 800 },
  { name: 'ENTC', value: 900 },
  { name: 'MECH', value: 600 },
  { name: 'CIVIL', value: 500 },
]

const registrationDataFallback = [
  { date: 'Oct 1', count: 45 }, { date: 'Oct 5', count: 120 },
  { date: 'Oct 10', count: 80 }, { date: 'Oct 15', count: 210 },
  { date: 'Oct 20', count: 150 }, { date: 'Oct 25', count: 300 }
]

const COLORS = ['#3B82F6', '#14B8A6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#10B981']

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    completeProfiles: '0%',
    activeInternships: 0,
    totalApplications: 0,
    placedStudents: 0
  })
  const [branchData, setBranchData] = useState([])
  const [appData, setAppData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [profilesReq, appsReq, internshipsReq] = await Promise.all([
        supabase.from('profiles').select('branch, profile_completion, created_at'),
        supabase.from('applications').select('status, internships(title)'),
        supabase.from('internships').select('id').eq('status', 'active')
      ])

      const profiles = profilesReq.data || []
      const apps = appsReq.data || []
      const internships = internshipsReq.data || []

      // Calculate Branches
      const branches = {}
      let complete = 0
      profiles.forEach(p => {
        if (p.branch) {
           branches[p.branch] = (branches[p.branch] || 0) + 1
        }
        if (p.profile_completion === 100) complete++
      })

      // Calculate Apps
      const appCounts = {}
      let placed = 0
      apps.forEach(a => {
        if (a.status === 'selected') placed++
        const title = a.internships?.title || 'Unknown'
        appCounts[title] = (appCounts[title] || 0) + 1
      })

      setStats({
        totalStudents: profiles.length,
        completeProfiles: profiles.length ? Math.round((complete / profiles.length) * 100) + '%' : '0%',
        activeInternships: internships.length,
        totalApplications: apps.length,
        placedStudents: placed
      })

      const branchArray = Object.entries(branches).map(([name, value]) => ({ name, value }))
      setBranchData(branchArray)

      const appsArray = Object.entries(appCounts)
        .map(([name, applications]) => ({ name, applications }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 5)
      setAppData(appsArray)

    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const kpiData = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400' },
    { title: 'Profiles Complete', value: stats.completeProfiles, icon: FileCheck, color: 'text-emerald-400' },
    { title: 'Active Internships', value: stats.activeInternships, icon: Briefcase, color: 'text-accent-gold' },
    { title: 'Total Applications', value: stats.totalApplications, icon: FileCheck, color: 'text-purple-400' },
    { title: 'Students Placed', value: stats.placedStudents, icon: Award, color: 'text-accent-teal' }
  ]

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Dashboard Overview</h1>
          <p className="text-text-secondary mt-1">High-level metrics and system activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20">
            <Link to="/admin/internships"><Plus className="w-4 h-4 mr-1"/> Post Internship</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20">
            <Link to="/admin/email"><Mail className="w-4 h-4 mr-1"/> Send Email</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20">
            <Link to="/admin/announcements"><Megaphone className="w-4 h-4 mr-1"/> Announcement</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, i) => (
          <motion.div 
            key={kpi.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-2xl font-bold font-heading text-text-primary mt-4 mb-1">{kpi.value}</h3>
            <p className="text-sm text-text-secondary font-medium">{kpi.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Applications per Internship */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 min-h-[400px]">
          <h2 className="text-lg font-heading font-bold mb-6">Top Internships by Application</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appData.length ? appData : [{name: 'No Data', applications: 0}]} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0E1425', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="applications" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Branch Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-heading font-bold mb-6">Students by Branch</h2>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={branchData.length ? branchData : [{name: 'No Data', value: 1}]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {(branchData.length ? branchData : [{name:'No Data'}]).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0E1425', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Registrations over time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 lg:col-span-2 min-h-[400px]">
          <h2 className="text-lg font-heading font-bold mb-6">Registrations (Last 30 Days)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationDataFallback} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0E1425', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4, fill: '#14B8A6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
