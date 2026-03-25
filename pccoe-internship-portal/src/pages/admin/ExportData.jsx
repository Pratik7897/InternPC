import { motion } from 'framer-motion'
import { Download, FileText, Users, Briefcase, FileCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

export default function ExportData() {

  const handleExport = (type) => {
    // Generate dummy CSV data utilizing papaparse mock to simulate download
    let data = []
    let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`

    if (type === 'students') {
      data = [
        { PRN: '121BEXXX', Name: 'Aisha Sharma', Branch: 'CSE', Year: 'BE', CGPA: 9.2, Backlogs: 0 },
        { PRN: '122ITYYY', Name: 'Rahul Verma', Branch: 'IT', Year: 'TE', CGPA: 8.7, Backlogs: 1 },
      ]
    } else if (type === 'internships') {
      data = [
        { Role: 'SWE Intern', Company: 'Google', PostedDate: '2026-10-01', Applicants: 450, Status: 'Open' },
        { Role: 'Data Intern', Company: 'Analytics Corp', PostedDate: '2026-10-05', Applicants: 120, Status: 'Closed' },
      ]
    } else {
      data = [
        { ApplicantName: 'Aisha Sharma', Role: 'SWE Intern', Company: 'Google', DateApplied: '2026-10-20', Status: 'Selected' },
      ]
    }

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

    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Data Export Pipeline</h1>
        <p className="text-text-secondary mt-1">Download system records in CSV format for institutional reporting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Student Records</h2>
          <p className="text-sm text-text-secondary mb-6 flex-1">Export complete profiles, academic details, skills, and contact information of all registered students.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('students')} className="w-full gap-2 shadow-[var(--glow)]"><Download className="w-4 h-4"/> Download CSV</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/20 text-accent-gold flex items-center justify-center mb-6">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Internships List</h2>
          <p className="text-sm text-text-secondary mb-6 flex-1">Export details of all posted internships, company names, requirements, and engagement metrics.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('internships')} className="w-full gap-2 shadow-[var(--glow)]"><Download className="w-4 h-4"/> Download CSV</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-accent-teal/20 text-accent-teal flex items-center justify-center mb-6">
            <FileCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Applications Report</h2>
          <p className="text-sm text-text-secondary mb-6 flex-1">Export a comprehensive log of who applied where, when, and their current pipeline status.</p>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('applications')} className="w-full gap-2 shadow-[var(--glow)]"><Download className="w-4 h-4"/> Download CSV</Button>
          </div>
        </motion.div>
        
      </div>

      <div className="mt-12 p-6 border border-emerald-500/30 bg-emerald-500/5 rounded-xl flex items-start gap-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-400 mb-1">Nightly Backups Active</h4>
          <p className="text-sm text-text-secondary">The database is automatically backed up nightly to secure AWS S3 buckets. Exports generated here reflect live data up to the current second.</p>
        </div>
      </div>

    </div>
  )
}
