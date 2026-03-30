import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Save, Loader2 } from 'lucide-react'
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

export default function ProfileForm() {
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
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
  })

  // Fetch initial profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
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
          cgpa: data.cgpa ? data.cgpa.toString() : '',
          backlogs: data.active_backlogs ? data.active_backlogs.toString() : '0',
          techSkills: data.technical_skills ? data.technical_skills.join(', ') : '',
          softSkills: data.soft_skills ? data.soft_skills.join(', ') : '',
        })
      }
    }
    fetchProfile()
  }, [user])

  const handleNext = () => setCurrentStep(s => Math.min(s + 1, 4))
  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleComplete = async () => {
    if (!user) return toast.error("Not logged in.")
    setIsSaving(true)
    try {
      // Calculate a real profile completion percentage
      const fields = [
        formData.fullName, formData.phone, formData.dob, formData.gender,
        formData.prn, formData.branch, formData.year, formData.cgpa,
        formData.techSkills
      ]
      const filled = fields.filter(f => f && f.toString().trim() !== '').length
      const completion = Math.round((filled / fields.length) * 100)

      const updateData = {
        id: user.id,
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
        active_backlogs: formData.backlogs ? parseInt(formData.backlogs) : 0,
        technical_skills: formData.techSkills
          ? formData.techSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        soft_skills: formData.softSkills
          ? formData.softSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        profile_completion: completion,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('profiles').upsert(updateData)
      if (error) throw error

      toast.success('Profile saved successfully! (' + completion + '% complete)')
    } catch (err) {
      console.error('Profile save error:', err)
      toast.error('Failed to save profile: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Complete Your Profile</h1>
        <p className="text-text-secondary mt-1">Make a great impression on top companies.</p>
      </div>

      {/* Stepper */}
      <div className="relative flex items-center justify-between mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-blue rounded-full z-0 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        ></div>

        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 font-bold text-sm
                  ${isCompleted ? 'bg-accent-blue text-white shadow-[var(--glow)]' : 
                    isActive ? 'border-2 border-accent-blue bg-background text-accent-blue shadow-[var(--glow)]' : 
                    'bg-secondary border border-white/10 text-text-secondary'}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap ${isActive ? 'text-accent-blue' : 'text-text-secondary'}`}>
                {step.title}
              </span>
            </div>
          )
        })}
      </div>

      <div className="glass-card p-6 md:p-8 min-h-[400px] flex flex-col pt-12 md:pt-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXXXXXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="" className="bg-background">Select Gender</option>
                      <option value="male" className="bg-background">Male</option>
                      <option value="female" className="bg-background">Female</option>
                      <option value="other" className="bg-background">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." className="mt-1" />
                  </div>
                  <div>
                    <Label>GitHub URL</Label>
                    <Input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Academic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>PRN Number</Label>
                    <Input value={formData.prn} onChange={e => setFormData({...formData, prn: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <select 
                      value={formData.branch}
                      onChange={e => setFormData({...formData, branch: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="" className="bg-background">Select Branch</option>
                      <option value="Computer Engineering" className="bg-background">Computer Engineering</option>
                      <option value="IT" className="bg-background">IT</option>
                      <option value="E&TC" className="bg-background">E&TC</option>
                      <option value="Mechanical" className="bg-background">Mechanical</option>
                      <option value="Civil" className="bg-background">Civil</option>
                    </select>
                  </div>
                  <div>
                    <Label>Current Year</Label>
                    <select 
                      value={formData.year}
                      onChange={e => setFormData({...formData, year: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                    >
                      <option value="" className="bg-background">Select Year</option>
                      <option value="First Year" className="bg-background">First Year</option>
                      <option value="Second Year" className="bg-background">Second Year</option>
                      <option value="Third Year" className="bg-background">Third Year</option>
                      <option value="Final Year" className="bg-background">Final Year</option>
                    </select>
                  </div>
                  <div>
                    <Label>CGPA (out of 10)</Label>
                    <Input type="number" step="0.01" value={formData.cgpa} onChange={e => setFormData({...formData, cgpa: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Active Backlogs</Label>
                    <Input type="number" value={formData.backlogs} onChange={e => setFormData({...formData, backlogs: e.target.value})} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Skills & Experience</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label>Technical Skills (Comma separated)</Label>
                    <Input value={formData.techSkills} onChange={e => setFormData({...formData, techSkills: e.target.value})} placeholder="React, Python, AWS..." className="mt-1" />
                  </div>
                  <div>
                    <Label>Soft Skills (Comma separated)</Label>
                    <Input value={formData.softSkills} onChange={e => setFormData({...formData, softSkills: e.target.value})} placeholder="Leadership, Agile..." className="mt-1" />
                  </div>
                  <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base text-accent-blue">Projects</Label>
                      <Button size="sm" variant="outline">+ Add Project</Button>
                    </div>
                    <p className="text-sm text-text-secondary">Click the button above to add projects that showcase your abilities.</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Review & Submit</h2>
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-text-secondary">Name</span>
                    <span className="font-medium text-text-primary">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-text-secondary">Branch / Year</span>
                    <span className="font-medium text-text-primary">{formData.branch} • {formData.year}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-text-secondary">CGPA</span>
                    <span className="font-medium text-text-primary">{formData.cgpa}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-2 text-sm text-text-secondary">
                     By saving your profile, you permit PCCOE to share these details with recruiting companies.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Save className="w-3 h-3" /> Draft Saved
            </span>
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gap-2 shadow-[var(--glow)]">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSaving} className="gap-2 bg-accent-teal hover:bg-accent-teal/90 text-background shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 
                {isSaving ? 'Uploading to DB...' : 'Submit Profile Now'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
