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
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [savedOk, setSavedOk] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  // ─── Load profile from Supabase on mount ─────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    setIsFetching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile error:', error)
        return
      }

      if (data) {
        const loaded = {
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
        }
        setFormData(loaded)
      }
    } catch (err) {
      console.error('Unexpected fetchProfile error:', err)
    } finally {
      setIsFetching(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => setCurrentStep(s => Math.min(s + 1, 4))
  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  // ─── Save to Supabase using SDK (upsert) ──────────────────────────────────
  const handleComplete = async () => {
    if (!user?.id) {
      toast.error('Not logged in. Please refresh and try again.')
      return
    }

    setIsSaving(true)
    setSavedOk(false)
    try {
      // Calculate profile completion %
      const fields = [
        formData.fullName, formData.phone, formData.dob, formData.gender,
        formData.prn, formData.branch, formData.year, formData.cgpa,
        formData.techSkills
      ]
      const filled = fields.filter(f => f && f.toString().trim() !== '').length
      const completion = Math.round((filled / fields.length) * 100)

      const payload = {
        id: user.id,          // required for upsert to match on PK
        email: user.email,    // keep email in sync
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
        technical_skills: formData.techSkills
          ? formData.techSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        soft_skills: formData.softSkills
          ? formData.softSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        profile_completion: completion,
        updated_at: new Date().toISOString(),
      }

      console.log('📤 Upserting profile for user:', user.id)
      console.log('📦 Payload:', payload)

      // Use Supabase JS SDK upsert — handles auth token automatically
      const { error } = await supabase
        .from('profiles')
        .upsert(payload, {
          onConflict: 'id',       // match on primary key
          ignoreDuplicates: false // we want to UPDATE on conflict
        })

      if (error) {
        console.error('Supabase upsert error:', error)
        throw new Error(error.message || 'Database error — check Supabase RLS policies.')
      }

      console.log('✅ Profile saved successfully!')
      setSavedOk(true)
      localStorage.removeItem('profile_form_started')
      toast.success(`Profile saved! ${completion}% complete`, { icon: '✅' })

      // Reload fresh from DB to confirm the save worked
      await fetchProfile()
    } catch (err) {
      console.error('Profile save error:', err)
      toast.error('Save failed: ' + (err.message || 'Unknown error'), { duration: 5000 })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Update field helper ──────────────────────────────────────────────────
  const update = (field) => (e) => {
    if (!localStorage.getItem('profile_form_started')) {
      localStorage.setItem('profile_form_started', Date.now().toString())
    }
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }
  const selectClass = "flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1 text-foreground"

  // ─── Loading state while fetching initial data ────────────────────────────
  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
          <p className="text-text-secondary text-sm">Loading your profile...</p>
        </div>
      </div>
    )
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

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 font-bold text-sm
                  ${isCompleted ? 'bg-accent-blue text-white shadow-[var(--glow)]' :
                    isActive ? 'border-2 border-accent-blue bg-background text-accent-blue shadow-[var(--glow)]' :
                    'bg-secondary border border-white/10 text-text-secondary'}`}
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
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {/* ── Step 1: Personal Info ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={formData.fullName} onChange={update('fullName')} placeholder="Pratik Shinde" className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={formData.phone} onChange={update('phone')} placeholder="+91 9XXXXXXXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dob} onChange={update('dob')} className="mt-1" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select value={formData.gender} onChange={update('gender')} className={selectClass}>
                      <option value="" className="bg-background">Select Gender</option>
                      <option value="male" className="bg-background">Male</option>
                      <option value="female" className="bg-background">Female</option>
                      <option value="other" className="bg-background">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>LinkedIn URL</Label>
                    <Input value={formData.linkedin} onChange={update('linkedin')} placeholder="https://linkedin.com/in/..." className="mt-1" />
                  </div>
                  <div>
                    <Label>GitHub URL</Label>
                    <Input value={formData.github} onChange={update('github')} placeholder="https://github.com/..." className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Academics ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Academic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>PRN Number</Label>
                    <Input value={formData.prn} onChange={update('prn')} placeholder="121BEXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <select value={formData.branch} onChange={update('branch')} className={selectClass}>
                      <option value="" className="bg-background">Select Branch</option>
                      <option value="Computer Engineering" className="bg-background">Computer Engineering</option>
                      <option value="IT" className="bg-background">IT</option>
                      <option value="E&TC" className="bg-background">E&TC</option>
                      <option value="Mechanical" className="bg-background">Mechanical</option>
                      <option value="Civil" className="bg-background">Civil</option>
                      <option value="AI & Data Science" className="bg-background">AI & Data Science</option>
                    </select>
                  </div>
                  <div>
                    <Label>Current Year</Label>
                    <select value={formData.year} onChange={update('year')} className={selectClass}>
                      <option value="" className="bg-background">Select Year</option>
                      <option value="First Year" className="bg-background">First Year</option>
                      <option value="Second Year" className="bg-background">Second Year</option>
                      <option value="Third Year" className="bg-background">Third Year</option>
                      <option value="Final Year" className="bg-background">Final Year</option>
                    </select>
                  </div>
                  <div>
                    <Label>CGPA (out of 10)</Label>
                    <Input type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={update('cgpa')} placeholder="e.g. 8.5" className="mt-1" />
                  </div>
                  <div>
                    <Label>Active Backlogs</Label>
                    <Input type="number" min="0" value={formData.backlogs} onChange={update('backlogs')} placeholder="0" className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Skills ── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Skills & Experience</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label>Technical Skills <span className="text-text-secondary text-xs">(comma separated)</span></Label>
                    <Input value={formData.techSkills} onChange={update('techSkills')} placeholder="React, Python, AWS, Java..." className="mt-1" />
                    {formData.techSkills && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.techSkills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                          <span key={skill} className="text-xs px-2 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Soft Skills <span className="text-text-secondary text-xs">(comma separated)</span></Label>
                    <Input value={formData.softSkills} onChange={update('softSkills')} placeholder="Leadership, Communication, Teamwork..." className="mt-1" />
                    {formData.softSkills && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.softSkills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                          <span key={skill} className="text-xs px-2 py-1 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/20">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Review ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold mb-4">Review & Submit</h2>
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-0 divide-y divide-white/10">
                  {[
                    { label: 'Full Name', value: formData.fullName },
                    { label: 'Phone', value: formData.phone },
                    { label: 'Date of Birth', value: formData.dob },
                    { label: 'Gender', value: formData.gender },
                    { label: 'PRN Number', value: formData.prn },
                    { label: 'Branch / Year', value: formData.branch && formData.year ? `${formData.branch} • ${formData.year}` : (formData.branch || formData.year) },
                    { label: 'CGPA', value: formData.cgpa },
                    { label: 'Technical Skills', value: formData.techSkills },
                    { label: 'Soft Skills', value: formData.softSkills },
                  ].map(({ label, value }) => (
                    value ? (
                      <div key={label} className="flex justify-between py-3 gap-4">
                        <span className="text-text-secondary text-sm shrink-0">{label}</span>
                        <span className="font-medium text-text-primary text-sm text-right">{value}</span>
                      </div>
                    ) : null
                  ))}
                </div>
                {savedOk && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Profile successfully saved to the database!
                  </div>
                )}
                <p className="text-xs text-text-secondary">
                  By saving your profile, you permit PCCOE to share these details with recruiting companies.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1 || isSaving} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gap-2 shadow-[var(--glow)]">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSaving}
                className="gap-2 bg-accent-teal hover:bg-accent-teal/90 text-background shadow-[0_0_20px_rgba(20,184,166,0.3)] min-w-[180px] justify-center"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...</>
                ) : savedOk ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved! Save Again</>
                ) : (
                  <><Check className="w-4 h-4" /> Submit Profile</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
