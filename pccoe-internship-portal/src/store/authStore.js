import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'student' | 'admin'
  providerToken: null, // Google OAuth Token
  isLoading: true, // Start true while we check initial session
  
  // Method to check active session on refresh
  checkSession: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, role: null, providerToken: null, isLoading: false })
      return
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.warn('Session check error:', error)
      }

      if (session?.user) {
        // Determine if admin or student
        const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle()
        set({ user: session.user, role: adminData ? 'admin' : 'student', providerToken: session.provider_token, isLoading: false })
      } else {
        set({ user: null, role: null, providerToken: null, isLoading: false })
      }
    } catch (err) {
      console.error('Initial session check failed:', err)
      set({ user: null, role: null, providerToken: null, isLoading: false })
    }
    
    // Listen for future auth events
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle()
        set({ user: session.user, role: adminData ? 'admin' : 'student', providerToken: session.provider_token })
      } else {
        set({ user: null, role: null, providerToken: null })
      }
    })
  },

  setUser: (user, role) => set({ user, role }),
  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email, password, isStudent) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator.' }
    
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (!data?.user) throw new Error('Failed to retrieve user data.')

      const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', data.user.id).maybeSingle()
      const actualRole = adminData ? 'admin' : 'student'

      if ((isStudent && actualRole === 'admin') || (!isStudent && actualRole === 'student')) {
        await supabase.auth.signOut()
        return { error: 'Invalid login portal for your role type. Please switch tabs.' }
      }

      set({ user: data.user, role: actualRole })
      return { success: true, role: actualRole }
    } catch (error) {
      // Return a user-friendly error message if it's a 400 Bad Request
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Are you sure you registered?' }
      }
      return { error: error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithOAuth: async (provider) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator. Ensure Vercel environment variables are set.' }

    set({ isLoading: true })
    try {
      // FORCE SIGN OUT FIRST to clear any stale/stuck sessions
      console.log('Force clearing existing session before OAuth...')
      await supabase.auth.signOut()
      
      const options = {
        redirectTo: window.location.origin + '/auth/callback'
      }

      // If logging in with google, restrict to institutional DOMAIN
      if (provider === 'google') {
        options.queryParams = {
          prompt: 'select_account login', // Force account selection AND login screen
          hd: 'pccoepune.org'
        }
      }

      console.log('Initiating OAuth login...', { provider, options })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: options
      })
      
      console.log('OAuth Response Data:', data)
      if (error) throw error
      
      // Explicitly trigger redirect
      if (data?.url) {
        console.log('Redirecting to Google Sign-in:', data.url)
        window.location.href = data.url
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('OAuth Error:', error)
      return { error: error.message || 'Error occurred during authentication initiation.' }
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password, fullName, prnNumber, branch, currentYear) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator.' }

    set({ isLoading: true })
    try {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      if (!authData?.user) throw new Error('Failed to retrieve user data.')

      // 2. Create the associated profile record in the database
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        prn_number: prnNumber,
        branch: branch,
        current_year: currentYear
      })

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      return { error: error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return
    
    set({ isLoading: true })
    await supabase.auth.signOut()
    set({ user: null, role: null, isLoading: false })
  }
}))
