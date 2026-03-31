import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { checkSession, user } = useAuthStore()
  const [status, setStatus] = useState('Authenticating...')

  useEffect(() => {
    // Check if there is an error snippet in the URL from a rejected Google Login
    const urlParams = new URLSearchParams(window.location.search)
    const errorDesc = urlParams.get('error_description')
    
    if (errorDesc) {
      toast.error(`Authentication Failed: ${errorDesc}`)
      navigate('/login', { replace: true })
      return
    }

    const processAuth = async () => {
      try {
        setStatus('Verifying session details...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (!session?.user) {
          throw new Error('No user session found after login.')
        }

        const currentUser = session.user
        
        setStatus('Checking profile status...')
        
        // 1. Is this user an Admin?
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (adminData) {
          // Sync store immediately and redirect admin
          await checkSession()
          toast.success('Admin login successful')
          navigate('/admin/dashboard', { replace: true })
          return
        }

        // 2. If Student, ensure they have a profile row
        // Because OAuth does not automatically fire database triggers natively here
        setStatus('Syncing student profile...')
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (!existingProfile) {
          // Create the foundational profile row for the new OAuth user
          const { error: insertError } = await supabase.from('profiles').insert({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || '',
            profile_completion: 0
          })

          if (insertError) {
            console.error('Failed to create profile row:', insertError)
            throw new Error('Could not synchronize student profile.')
          }
        }

        // 3. Sync global Zustand state and forward to student dashboard
        await checkSession()
        toast.success('Login successful')
        navigate('/student/dashboard', { replace: true })

      } catch (err) {
        console.error('Callback error:', err)
        toast.error(err.message || 'Error occurred during login synchronization.')
        navigate('/login', { replace: true })
      }
    }

    processAuth()
  }, [navigate, checkSession])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="glass-card p-8 md:p-12 text-center max-w-md w-full flex flex-col items-center space-y-6">
        <div className="w-16 h-16 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin"></div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Securely Logging In</h2>
          <p className="text-text-secondary">{status}</p>
        </div>
      </div>
    </div>
  )
}
