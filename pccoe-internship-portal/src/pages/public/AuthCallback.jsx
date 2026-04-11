import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const [status, setStatus] = useState('Completing sign-in...')
  const [errorMsg, setErrorMsg] = useState(null)
  // Guard against running the exchange twice (React StrictMode double-invoke)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const processAuth = async () => {
      try {
        // Check for explicit OAuth errors passed back in the URL query string
        const urlParams = new URLSearchParams(window.location.search)
        const errorCode = urlParams.get('error')
        const errorDesc = urlParams.get('error_description')

        if (errorCode) {
          const msg = errorDesc
            ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
            : 'Authentication was cancelled or failed.'
          setErrorMsg(msg)
          toast.error(msg)
          setTimeout(() => navigate('/login', { replace: true }), 2500)
          return
        }

        // Supabase PKCE: exchange the `code` in the URL for a real session
        const code = urlParams.get('code')

        let session = null

        if (code) {
          setStatus('Exchanging credentials...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          session = data.session
        } else {
          // Fallback: hash-based implicit flow (older Supabase setups)
          setStatus('Verifying session...')
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          session = data.session
        }

        if (!session?.user) {
          throw new Error('No user session found. Please try signing in again.')
        }

        await handleSession(session)
      } catch (err) {
        console.error('Auth callback error:', err)
        const msg = err.message || 'An error occurred during sign-in. Please try again.'
        setErrorMsg(msg)
        toast.error(msg)
        setTimeout(() => navigate('/login', { replace: true }), 2500)
      }
    }

    const handleSession = async (session) => {
      const currentUser = session.user

      // Domain enforcement: only @pccoepune.org is allowed
      if (!currentUser.email || !currentUser.email.endsWith('@pccoepune.org')) {
        await supabase.auth.signOut()
        const msg = 'Access denied. Only @pccoepune.org email addresses are allowed.'
        setErrorMsg(msg)
        toast.error(msg)
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      const providerToken = session.provider_token || null

      if (providerToken) {
        localStorage.setItem('gmail_provider_token', providerToken)
      }

      // Student: ensure a profile row exists
      setStatus('Setting up your profile...')

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (!existingProfile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || '',
          profile_completion: 0
        })

        if (insertError && insertError.code !== '23505') {
          console.error('Profile creation failed:', insertError)
        }
      }

      setUser(currentUser, providerToken)
      toast.success('Login successful! Welcome to the portal.')
      navigate('/student/dashboard', { replace: true })
    }

    processAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="glass-card p-8 md:p-12 text-center max-w-md w-full flex flex-col items-center space-y-6">
        {errorMsg ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-3xl">
              ✕
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Login Failed</h2>
              <p className="text-text-secondary text-sm">{errorMsg}</p>
              <p className="text-text-secondary text-xs mt-2 opacity-60">Redirecting you back...</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin" />
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Securely Logging In</h2>
              <p className="text-text-secondary">{status}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
