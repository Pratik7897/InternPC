import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const statusStyles = {
  applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shortlisted: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
  interview: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20',
  selected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ApplicationsManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, status, applied_at, admin_notes,
          profiles ( id, full_name, prn_number, profile_completion, email ),
          internships ( id, title, company_name )
        `)
        .order('applied_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      toast.error('Failed to fetch applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    // Optimistic update
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus } : app))
    
    try {
      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      toast.success(`Application status updated!`)
    } catch (err) {
      toast.error('Failed to update status in database')
      fetchApplications() // revert
    }
  }

  const filteredApps = applications.filter(app => 
    app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.internships?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.profiles?.prn_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Applications Center</h1>
          <p className="text-text-secondary mt-1">Review student applications and track placement progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              placeholder="Search student or role..." 
              className="pl-9 h-10" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 shrink-0 glass"><Filter className="w-4 h-4"/> Filter Status</Button>
        </div>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col relative rounded-xl border border-white/10">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-text-secondary sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-medium">Candidate</th>
                <th className="p-4 font-medium">Role Details</th>
                <th className="p-4 font-medium">Date Applied</th>
                <th className="p-4 font-medium">Fit Score</th>
                <th className="p-4 font-medium">Status Pipeline</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-text-secondary">Loading student applications...</td></tr>
              ) : filteredApps.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-text-secondary">No applications found.</td></tr>
              ) : filteredApps.map((app, i) => (
                <motion.tr 
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4">
                    <div className="font-heading font-semibold text-text-primary">{app.profiles?.full_name || 'Unknown Student'}</div>
                    <div className="text-xs text-text-secondary font-mono mt-0.5">{app.profiles?.prn_number || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{app.internships?.title}</div>
                    <div className="text-accent-blue text-xs mt-0.5">{app.internships?.company_name}</div>
                  </td>
                  <td className="p-4 text-text-secondary">{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className={`font-bold ${app.profiles?.profile_completion >= 80 ? 'text-emerald-400' : app.profiles?.profile_completion >= 50 ? 'text-accent-gold' : 'text-text-secondary'}`}>
                      {app.profiles?.profile_completion || 0}% Complete
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-3 py-1.5 border outline-none cursor-pointer appearance-none ${statusStyles[app.status] || statusStyles['applied']}`}
                    >
                      <option value="applied" className="bg-background text-text-primary">● Applied</option>
                      <option value="shortlisted" className="bg-background text-text-primary">● Shortlisted</option>
                      <option value="interview" className="bg-background text-text-primary">● Interviewing</option>
                      <option value="selected" className="bg-background text-text-primary">● Selected</option>
                      <option value="rejected" className="bg-background text-text-primary">● Rejected</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-text-secondary hover:text-white" title="View Student Profile" onClick={() => window.open(`/student/${app.profiles?.id}`, '_target')}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-accent-blue hover:text-white" title="Email Student" onClick={() => window.open(`mailto:${app.profiles?.email}`, '_blank')}>
                         <Mail className="w-4 h-4"/>
                       </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
