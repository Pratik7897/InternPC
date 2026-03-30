import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, FileText, Video, Award, X, Eye, FileUp, Loader2, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function UploadCenter() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isUploadingCert, setIsUploadingCert] = useState(false)
  const [certName, setCertName] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [showCertForm, setShowCertForm] = useState(false)
  
  const resumeInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const certInputRef = useRef(null)
  const [pendingCertFile, setPendingCertFile] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
  }

  const uploadFile = async (file, path, bucket = 'documents') => {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error("File must be under 5MB")
    if (file.type !== 'application/pdf') return toast.error("Only PDF allowed")

    setIsUploadingResume(true)
    try {
      const url = await uploadFile(file, `${user.id}/resume.pdf`)
      await supabase.from('profiles').update({ resume_url: url }).eq('id', user.id)
      setProfile(prev => ({ ...prev, resume_url: url }))
      toast.success('Resume uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload resume: ' + err.message)
    } finally {
      setIsUploadingResume(false)
      event.target.value = ''
    }
  }

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) return toast.error("Video must be under 100MB")

    setIsUploadingVideo(true)
    try {
      const ext = file.name.split('.').pop()
      const url = await uploadFile(file, `${user.id}/intro_video.${ext}`)
      await supabase.from('profiles').update({ intro_video_url: url }).eq('id', user.id)
      setProfile(prev => ({ ...prev, intro_video_url: url }))
      toast.success('Video uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload video: ' + err.message)
    } finally {
      setIsUploadingVideo(false)
      event.target.value = ''
    }
  }

  const handleCertFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error("Certificate file must be under 10MB")
    setPendingCertFile(file)
    setShowCertForm(true)
  }

  const handleCertUpload = async () => {
    if (!pendingCertFile) return toast.error("Please select a certificate file first")
    if (!certName.trim()) return toast.error("Please enter the certificate name")
    if (!certIssuer.trim()) return toast.error("Please enter the issuer name")

    setIsUploadingCert(true)
    try {
      const timestamp = Date.now()
      const ext = pendingCertFile.name.split('.').pop()
      const url = await uploadFile(pendingCertFile, `${user.id}/certs/${timestamp}.${ext}`)

      const existingCerts = profile?.certificates || []
      const newCert = {
        name: certName.trim(),
        issuer: certIssuer.trim(),
        url: url,
        uploaded_at: new Date().toISOString()
      }
      const updatedCerts = [...existingCerts, newCert]

      await supabase.from('profiles').update({ certificates: updatedCerts }).eq('id', user.id)
      setProfile(prev => ({ ...prev, certificates: updatedCerts }))

      setCertName('')
      setCertIssuer('')
      setPendingCertFile(null)
      setShowCertForm(false)
      toast.success('Certificate uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload certificate: ' + err.message)
    } finally {
      setIsUploadingCert(false)
      if (certInputRef.current) certInputRef.current.value = ''
    }
  }

  const handleDeleteCert = async (index) => {
    const updatedCerts = (profile?.certificates || []).filter((_, i) => i !== index)
    await supabase.from('profiles').update({ certificates: updatedCerts }).eq('id', user.id)
    setProfile(prev => ({ ...prev, certificates: updatedCerts }))
    toast.success('Certificate removed')
  }

  const certificates = profile?.certificates || []

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Document Center</h1>
        <p className="text-text-secondary mt-1">Manage your resume, introduction video, and certificates in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Resume Node */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 text-accent-blue flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-heading font-bold">Resume</h2>
          </div>
          
          <input type="file" className="hidden" accept=".pdf" ref={resumeInputRef} onChange={handleResumeUpload} />
          
          {profile?.resume_url ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6 border-2 border-dashed border-accent-blue/30 rounded-xl bg-accent-blue/5">
              <FileUp className="w-12 h-12 text-accent-blue mb-4 opacity-50" />
              <p className="font-medium text-text-primary mb-1">Resume Uploaded</p>
              <Badge variant="outline" className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active PDF</Badge>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="gap-2 glass" onClick={() => window.open(profile.resume_url, '_blank')}><Eye className="w-4 h-4"/> Preview</Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => resumeInputRef.current?.click()}><UploadCloud className="w-4 h-4"/> Replace</Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex-1 flex flex-col justify-center items-center p-8 border-2 border-dashed border-white/20 hover:border-accent-blue/50 hover:bg-white/5 transition-all rounded-xl cursor-pointer"
              onClick={() => !isUploadingResume && resumeInputRef.current?.click()}
            >
              {isUploadingResume ? (
                 <Loader2 className="w-12 h-12 text-accent-blue animate-spin mb-4" />
              ) : (
                 <UploadCloud className="w-12 h-12 text-text-secondary mb-4" />
              )}
              <p className="font-medium text-text-primary mb-1">{isUploadingResume ? 'Uploading...' : 'Click to Upload Resume'}</p>
              <p className="text-xs text-text-secondary text-center">PDF only, max 5MB</p>
            </div>
          )}
        </motion.div>

        {/* Intro Video Node */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-teal/20 text-accent-teal flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold">Introduction Video</h2>
              <Badge variant="secondary" className="bg-accent-gold/20 text-accent-gold border-0 mt-1">Highly Recommended</Badge>
            </div>
          </div>
          
          <input type="file" className="hidden" accept="video/*" ref={videoInputRef} onChange={handleVideoUpload} />

          {profile?.intro_video_url ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6 border-2 border-dashed border-accent-teal/30 rounded-xl bg-accent-teal/5">
              <Video className="w-12 h-12 text-accent-teal mb-4 opacity-50" />
              <p className="font-medium text-text-primary mb-1">Video Uploaded</p>
              <Badge variant="outline" className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active Video</Badge>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="gap-2 glass" onClick={() => window.open(profile.intro_video_url, '_blank')}><Eye className="w-4 h-4"/> Watch</Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => videoInputRef.current?.click()}><UploadCloud className="w-4 h-4"/> Replace</Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex-1 flex flex-col justify-center items-center p-8 border-2 border-dashed border-white/20 hover:border-accent-teal/50 hover:bg-white/5 transition-all rounded-xl cursor-pointer"
              onClick={() => !isUploadingVideo && videoInputRef.current?.click()}
            >
              {isUploadingVideo ? (
                 <Loader2 className="w-12 h-12 text-accent-teal animate-spin mb-4" />
              ) : (
                 <UploadCloud className="w-12 h-12 text-text-secondary mb-4" />
              )}
              <p className="font-medium text-text-primary mb-1">{isUploadingVideo ? 'Uploading...' : 'Upload Intro Video'}</p>
              <p className="text-xs text-text-secondary text-center max-w-[200px]">Any video format (MP4, MOV, etc). Max 100MB.</p>
            </div>
          )}
        </motion.div>

        {/* Certificates Node */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-gold/20 text-accent-gold flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold">Certificates</h2>
                <p className="text-xs text-text-secondary mt-0.5">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} uploaded</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => { setShowCertForm(true); certInputRef.current?.click() }} 
              className="shadow-[var(--glow)] gap-2"
              disabled={isUploadingCert}
            >
              <Plus className="w-4 h-4" /> Add Certificate
            </Button>
          </div>

          {/* Hidden file input for cert */}
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png" 
            ref={certInputRef} 
            onChange={handleCertFileSelect} 
          />

          {/* Certificate upload form */}
          {showCertForm && (
            <div className="mb-6 p-4 border border-accent-gold/30 bg-accent-gold/5 rounded-xl space-y-3">
              <p className="text-sm font-medium text-accent-gold">
                {pendingCertFile ? `File selected: ${pendingCertFile.name}` : 'Select a file first (PDF or Image)'}
              </p>
              {pendingCertFile && (
                <>
                  <input
                    type="text"
                    placeholder="Certificate Name (e.g. AWS Cloud Practitioner)"
                    value={certName}
                    onChange={e => setCertName(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Issuer (e.g. Amazon Web Services)"
                    value={certIssuer}
                    onChange={e => setCertIssuer(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex gap-3">
                    <Button size="sm" onClick={handleCertUpload} disabled={isUploadingCert} className="gap-2">
                      {isUploadingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      {isUploadingCert ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowCertForm(false); setPendingCertFile(null); setCertName(''); setCertIssuer('') }}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-lg text-sm text-text-secondary text-center">
                No certificates uploaded yet. Click "Add Certificate" to get started.
              </div>
            ) : (
              certificates.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-accent-gold shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm text-text-primary">{cert.name}</h4>
                      <p className="text-xs text-text-secondary">{cert.issuer}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cert.url && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-md" onClick={() => window.open(cert.url, '_blank')}>
                        <Eye className="w-4 h-4 text-text-secondary hover:text-white" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-md" onClick={() => handleDeleteCert(index)}>
                      <X className="w-4 h-4 text-destructive hover:text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
