import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function InternshipsManagement() {
  const { user } = useAuthStore()
  const [internships, setInternships] = useState([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, title } of internship to delete
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: '', company_name: '', description: '', requirements: '',
    stipend: '', location: '', work_mode: '', duration: '', deadline: '',
    apply_link: '', is_featured: false
  })
  
  useEffect(() => {
    fetchInternships()
  }, [])

  const fetchInternships = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('internships')
        .select(`*, applications(count)`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInternships(data || [])
    } catch (error) {
      toast.error('Failed to load internships')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('internships').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setInternships(internships.filter(i => i.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.title}" deleted successfully.`)
      setDeleteTarget(null)
    } catch (error) {
      toast.error('Failed to delete internship')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('internships').insert({
        title: formData.title,
        company_name: formData.company_name,
        description: formData.description,
        requirements: formData.requirements.split(',').map(s => s.trim()).filter(Boolean),
        stipend: formData.stipend || null,
        location: formData.location || null,
        work_mode: formData.work_mode || 'Onsite',
        duration: formData.duration || null,
        deadline: formData.deadline || null,
        apply_link: formData.apply_link || null,
        is_featured: formData.is_featured,
        is_active: true,
        posted_by: user.id
      }).select()

      if (error) throw error

      setInternships([data[0], ...internships])
      setIsModalOpen(false)
      toast.success('Internship published successfully.')
      setFormData({ title: '', company_name: '', description: '', requirements: '', stipend: '', location: '', work_mode: '', duration: '', deadline: '', apply_link: '', is_featured: false })
    } catch (error) {
      toast.error('Failed to publish internship')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Internships Engine</h1>
          <p className="text-text-secondary mt-1">Create and manage internship opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or companies..."
              className="pl-9 h-10"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0 shadow-[var(--glow)]">
            <Plus className="w-4 h-4"/> Post New
          </Button>
        </div>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col relative rounded-xl border border-white/10">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-text-secondary sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-medium">Role Title</th>
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Deadline</th>
                <th className="p-4 font-medium">Applicants</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="6" className="p-4 text-center text-text-secondary">Loading internships...</td></tr>
              ) : internships.filter(j =>
                  !search ||
                  j.title?.toLowerCase().includes(search.toLowerCase()) ||
                  j.company_name?.toLowerCase().includes(search.toLowerCase())
                ).map((job, i) => (
                <motion.tr 
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 font-heading font-semibold text-text-primary">{job.title}</td>
                  <td className="p-4 text-text-secondary">{job.company_name}</td>
                  <td className="p-4 text-text-secondary">{job.deadline}</td>
                  <td className="p-4 font-medium text-accent-blue">{job.applications?.[0]?.count || 0}</td>
                  <td className="p-4">
                    {job.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">Active</Badge>
                    ) : (
                      <Badge className="bg-white/10 text-text-secondary border border-white/10 text-xs">Closed</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-2">
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-text-secondary hover:text-white" onClick={() => setIsModalOpen(true)}>
                         <Edit2 className="w-4 h-4"/>
                       </Button>
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-8 w-8 text-destructive hover:bg-destructive/10"
                         onClick={() => setDeleteTarget({ id: job.id, title: job.title })}
                       >
                         <Trash2 className="w-4 h-4"/>
                       </Button>
                     </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></motion.div>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass-card border flex-1 border-white/20 bg-secondary/90 shadow-2xl overflow-hidden rounded-2xl">
              
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-xl">
                <h2 className="text-2xl font-heading font-bold">Post New Internship</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <form id="post-job-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Role Title</Label>
                      <Input placeholder="e.g. Frontend Developer Intern" className="mt-1" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <Input placeholder="e.g. Google" className="mt-1" required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <textarea className="w-full h-32 rounded-lg border border-white/10 bg-white/5 mt-1 p-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none resize-none" placeholder="Describe the role..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                        <Label>Requirements (comma separated)</Label>
                        <Input placeholder="React, Node.js, SQL" className="mt-1" value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} />
                    </div>
                    <div>
                        <Label>Stipend <span className="text-text-secondary text-xs">(optional)</span></Label>
                        <Input placeholder="e.g. ₹20,000 / month or Unpaid" className="mt-1" value={formData.stipend} onChange={e => setFormData({...formData, stipend: e.target.value})} />
                    </div>
                    <div>
                        <Label>Location</Label>
                        <Input placeholder="e.g. Pune / Remote" className="mt-1" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <Label>Work Mode</Label>
                        <select
                          value={formData.work_mode}
                          onChange={e => setFormData({...formData, work_mode: e.target.value})}
                          className="flex h-10 w-full mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                        >
                          <option value="" className="bg-background">Select Mode</option>
                          <option value="Remote" className="bg-background">Remote</option>
                          <option value="Onsite" className="bg-background">Onsite</option>
                          <option value="Hybrid" className="bg-background">Hybrid</option>
                        </select>
                    </div>
                    <div>
                        <Label>Duration</Label>
                        <Input placeholder="e.g. 2 months, 6 weeks" className="mt-1" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                    </div>
                    <div>
                        <Label>Application Deadline</Label>
                        <Input type="date" className="mt-1" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                    <div>
                        <Label>Apply Link <span className="text-text-secondary text-xs">(optional)</span></Label>
                        <Input placeholder="https://company.com/apply" className="mt-1" value={formData.apply_link} onChange={e => setFormData({...formData, apply_link: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3 p-4 border border-accent-gold/30 bg-accent-gold/5 rounded-xl">
                       <input type="checkbox" id="featured" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-gold focus:ring-accent-gold" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                       <label htmlFor="featured" className="text-sm font-medium text-accent-gold">Feature this internship (Highlights it in gold)</label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/10 bg-black/20 shrink-0 flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit" form="post-job-form" className="shadow-[var(--glow)]">Publish Internship</Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card border border-red-500/20 bg-secondary/95 shadow-2xl rounded-2xl p-6"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>

              <h3 className="text-xl font-heading font-bold text-center mb-2">Delete Internship?</h3>
              <p className="text-text-secondary text-sm text-center mb-1">
                You are about to permanently delete:
              </p>
              <p className="text-center font-semibold text-white mb-1">&ldquo;{deleteTarget.title}&rdquo;</p>
              <p className="text-xs text-red-400/80 text-center mb-6">
                ⚠️ This will also remove all student applications for this role. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-500/50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
