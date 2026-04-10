// DEBUG: Force git change detection
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Academics' },
  { id: 3, title: 'Skills & Experience' },
  { id: 4, title: 'Review' }
]

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  dob: '',
  gender: '',
  linkedin: '',
  github: '',
  prn: '',
  branch: '',
  year: '',
  cgpa: '',
  backlogs: '0',
  techSkills: '',
  softSkills: '',
}

export default function ProfileForm() {
  const { user, setProfileCompletion } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [savedOk, setSavedOk] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    setIsFetching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setFormData({
          fullName: data.full_name || '',
          phone: data.phone || '',
          dob: data.date_of_birth || '',
          gender: data.gender || '',
          linkedin: data.linkedin_url || '',
          github: data.github_url || '',
          prn: data.prn_number || '',
          branch: data.branch || '',
          year: data.current_year || '',
          cgpa: data.cgpa != null ? String(data.cgpa) : '',
          backlogs: data.active_backlogs != null ? String(data.active_backlogs) : '0',
          techSkills: Array.isArray(data.technical_skills) ? data.technical_skills.join(', ') : '',
          softSkills: Array.isArray(data.soft_skills) ? data.soft_skills.join(', ') : '',
        })
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
    } finally {
      setIsFetching(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleNext = () => setCurrentStep(s => Math.min(s + 1, 4))
  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleComplete = async () => {
    if (!user?.id) return
    setIsSaving(true)
    setSavedOk(false)
    try {
      const payload = {
        id: user.id,
        email: user.email,
        full_name: formData.fullName || null,
        phone: formData.phone || null,
        date_of_birth: formData.dob || null,
        gender: formData.gender || null,
        linkedin_url: formData.linkedin || null,
        github_url: formData.github || null,
        prn_number: formData.prn || null,
        branch: formData.branch || null,
        current_year: formData.year || null,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        active_backlogs: formData.backlogs ? parseInt(formData.backlogs, 10) : 0,
        technical_skills: formData.techSkills ? formData.techSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        soft_skills: formData.softSkills ? formData.softSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').upsert(payload)
      if (error) throw error

      setSavedOk(true)
      localStorage.removeItem('profile_form_started')
      
      // We don't need to manually call setProfileCompletion here anymore 
      // because the Sidebar component is listening for real-time updates from Supabase.
      
      toast.success('Profile saved successfully!')
      await fetchProfile()
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const update = (field) => (e) => {
    if (!localStorage.getItem('profile_form_started')) {
      localStorage.setItem('profile_form_started', Date.now().toString())
    }
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  if (isFetching) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Complete Your Profile</h1>
        <p className="text-text-secondary mt-1">Make a great impression on top companies.</p>
      </div>

      <div className="relative flex items-center justify-between mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-blue rounded-full z-0 transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
        {STEPS.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= step.id ? 'bg-accent-blue text-white' : 'bg-secondary border border-white/10 text-text-secondary'}`}>
              {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
            </div>
            <span className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap ${currentStep === step.id ? 'text-accent-blue' : 'text-text-secondary'}`}>{step.title}</span>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 md:p-8 min-h-[400px] flex flex-col pt-12 md:pt-8 bg-white/5 border border-white/10">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label>Full Name</Label><Input value={formData.fullName} onChange={update('fullName')} className="mt-1" /></div>
                <div><Label>Phone Number</Label><Input value={formData.phone} onChange={update('phone')} className="mt-1" /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={formData.dob} onChange={update('dob')} className="mt-1" /></div>
                <div><Label>Gender</Label>
                  <select value={formData.gender} onChange={update('gender')} className="w-full mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:ring-2 focus:ring-accent-blue outline-none">
                    <option value="" className="bg-secondary text-white">Select Gender</option>
                    <option value="Male" className="bg-secondary text-white">Male</option>
                    <option value="Female" className="bg-secondary text-white">Female</option>
                    <option value="Other" className="bg-secondary text-white">Other</option>
                  </select>
                </div>
                <div><Label>LinkedIn URL</Label><Input value={formData.linkedin} onChange={update('linkedin')} className="mt-1" /></div>
                <div><Label>GitHub URL</Label><Input value={formData.github} onChange={update('github')} className="mt-1" /></div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label>PRN Number</Label><Input value={formData.prn} onChange={update('prn')} className="mt-1" /></div>
                <div><Label>Branch</Label>
                  <select value={formData.branch} onChange={update('branch')} className="w-full mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <option value="">Select Branch</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="IT">IT</option>
                    <option value="EnTC">EnTC</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div><Label>Current Year</Label>
                  <select value={formData.year} onChange={update('year')} className="w-full mt-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <option value="">Select Year</option>
                    <option value="FE">FE</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                    <option value="BE">BE</option>
                  </select>
                </div>
                <div><Label>CGPA</Label><Input type="number" step="0.01" value={formData.cgpa} onChange={update('cgpa')} className="mt-1" /></div>
                <div><Label>Active Backlogs</Label><Input type="number" value={formData.backlogs} onChange={update('backlogs')} className="mt-1" /></div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Technical Skills (comma separated)</Label>
                  <textarea value={formData.techSkills} onChange={update('techSkills')} className="w-full mt-1 h-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-blue resize-none"></textarea>
                </div>
                <div>
                  <Label>Soft Skills (comma separated)</Label>
                  <textarea value={formData.softSkills} onChange={update('softSkills')} className="w-full mt-1 h-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-blue resize-none"></textarea>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-6 text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-accent-blue mx-auto mb-4" />
                <h3 className="text-xl font-bold">Ready to Submit?</h3>
                <p className="text-text-secondary text-sm">Review your details before finalizing.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1 || isSaving}>Back</Button>
          <div className="flex items-center gap-3">
            {currentStep < 4 ? <Button onClick={handleNext}>Next</Button> : (
              <Button onClick={handleComplete} disabled={isSaving} className="bg-accent-blue min-w-[150px]">
                {isSaving ? 'Saving...' : 'Submit Profile'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
