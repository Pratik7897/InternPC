import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Users, Briefcase, FileCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'

export default function ExportData() {
  const [exporting, setExporting] = useState(null) // 'students' | 'internships' | 'applications'

  const downloadCSV = (data, filename) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type) => {
    setExporting(type)
    try {
      const date = new Date().toISOString().split('T')[0]
      const filename = `pccoe_${type}_${date}.csv`

      if (type === 'students') {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, prn_number, branch, current_year, cgpa, active_backlogs, profile_completion, resume_url, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        const rows = (data || []).map(s => ({
          Name: s.full_name || '',
          Email: s.email || '',
          PRN: s.prn_number || '',
          Branch: s.branch || '',
          Year: s.current_year || '',
          CGPA: s.cgpa || '',
          Backlogs: s.active_backlogs ?? 0,
          'Profile %': s.profile_completion || 0,
          'Resume Uploaded': s.resume_url ? 'Yes' : 'No',
          'Registered On': s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
        }))
        downloadCSV(rows, filename)
        toast.success(`Exported ${rows.length} student records`)

      } else if (type === 'internships') {
        const { data, error } = await supabase
          .from('internships')
          .select('title, company_name, location, work_mode, stipend, duration, deadline, is_active, is_featured, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        const rows = (data || []).map(j => ({
          Role: j.title || '',
          Company: j.company_name || '',
          Location: j.location || '',
          'Work Mode': j.work_mode || '',
          Stipend: j.stipend || '',
          Duration: j.duration || '',
          Deadline: j.deadline || '',
          Status: j.is_active ? 'Active' : 'Closed',
          Featured: j.is_featured ? 'Yes' : 'No',
          'Posted On': j.created_at ? new Date(j.created_at).toLocaleDateString() : ''
        }))
        downloadCSV(rows, filename)
        toast.success(`Exported ${rows.length} internship listings`)

      } else if (type === 'applications') {
        const { data, error } = await supabase
          .from('applications')
          .select('status, applied_at, cover_note, profiles(full_name, prn_number, email, branch), internships(title, company_name)')
          .order('applied_at', { ascending: false })
        if (error) throw error
        const rows = (data || []).map(a => ({
          'Student Name': a.profiles?.full_name || '',
          PRN: a.profiles?.prn_number || '',
          Email: a.profiles?.email || '',
          Branch: a.profiles?.branch || '',
          Role: a.internships?.title || '',
          Company: a.internships?.company_name || '',
          Status: a.status || '',
          'Applied On': a.applied_at ? new Date(a.applied_at).toLocaleDateString() : ''
        }))
        downloadCSV(rows, filename)
        toast.success(`Exported ${rows.length} application records`)
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Export failed: ' + (err.message || 'Unknown error'))
    } finally {
      setExporting(null)
    }
  }

  const cards = [
    {
      type: 'students',
      icon: Users,
      color: 'bg-blue-500/20 text-blue-400',
      title: 'Student Records',
      desc: 'Export complete profiles — academic details, skills, contact information, and document status of all registered students.'
    },
    {
      type: 'internships',
      icon: Briefcase,
      color: 'bg-accent-gold/20 text-accent-gold',
      title: 'Internships List',
      desc: 'Export all posted internships with company names, requirements, deadlines, and active/featured status.'
    },
    {
      type: 'applications',
      icon: FileCheck,
      color: 'bg-accent-teal/20 text-accent-teal',
      title: 'Applications Report',
      desc: 'Export a full log of who applied where, when, and their current pipeline status (applied/shortlisted/selected/rejected).'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Data Export Pipeline</h1>
        <p className="text-text-secondary mt-1">Download live system records in CSV format for institutional reporting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col"
          >
            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-6`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">{card.title}</h2>
            <p className="text-sm text-text-secondary mb-6 flex-1">{card.desc}</p>
            <Button
              onClick={() => handleExport(card.type)}
              disabled={exporting === card.type}
              className="w-full gap-2 shadow-[var(--glow)]"
            >
              {exporting === card.type ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4" /> Download CSV</>
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-6 border border-emerald-500/30 bg-emerald-500/5 rounded-xl flex items-start gap-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-400 mb-1">Live Data Export</h4>
          <p className="text-sm text-text-secondary">Exports pull directly from your Supabase database in real time — no mock data. All records reflect the current state of the portal.</p>
        </div>
      </div>
    </div>
  )
}
