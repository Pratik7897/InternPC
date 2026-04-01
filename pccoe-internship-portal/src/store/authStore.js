import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// localStorage key for persisting the Gmail provider token across page refreshes
const PROVIDER_TOKEN_KEY = 'gmail_provider_token'

// Track if we've already registered the auth listener to prevent duplicates
let authListenerRegistered = false

const saveProviderToken = (token) => {
  if (token) {
    localStorage.setItem(PROVIDER_TOKEN_KEY, token)
  }
}

const loadProviderToken = () => {
  return localStorage.getItem(PROVIDER_TOKEN_KEY) || null
}

const clearProviderToken = () => {
  localStorage.removeItem(PROVIDER_TOKEN_KEY)
}

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null, // 'student' | 'admin'
  providerToken: loadProviderToken(), // Restore from localStorage immediately
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
        // If the refresh token is invalid/expired, force sign out and clear storage
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
          console.warn('Stale refresh token detected — clearing session.')
          await supabase.auth.signOut()
          clearProviderToken()
          set({ user: null, role: null, providerToken: null, isLoading: false })
          return
        }
      }

      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()

        const freshToken = session.provider_token || loadProviderToken()
        if (session.provider_token) {
          saveProviderToken(session.provider_token)
        }

        set({
          user: session.user,
          role: adminData ? 'admin' : 'student',
          providerToken: freshToken,
          isLoading: false
        })
      } else {
        clearProviderToken()
        set({ user: null, role: null, providerToken: null, isLoading: false })
      }
    } catch (err) {
      console.error('Initial session check failed:', err)
      // On any unrecoverable auth error, wipe everything and let user re-login
      clearProviderToken()
      await supabase.auth.signOut().catch(() => {})
      set({ user: null, role: null, providerToken: null, isLoading: false })
    }

    // Only register the auth state listener ONCE globally
    if (!authListenerRegistered) {
      authListenerRegistered = true
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event)
        if (event === 'SIGNED_OUT') {
          clearProviderToken()
          set({ user: null, role: null, providerToken: null })
          return
        }
        if (session?.user) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle()

          // Persist fresh token if available
          if (session.provider_token) {
            saveProviderToken(session.provider_token)
          }
          const token = session.provider_token || loadProviderToken()

          set({
            user: session.user,
            role: adminData ? 'admin' : 'student',
            providerToken: token
          })
        } else {
          clearProviderToken()
          set({ user: null, role: null, providerToken: null })
        }
      })
    }
  },

  setUser: (user, role, providerToken = null) => {
    if (providerToken) saveProviderToken(providerToken)
    set({ user, role, providerToken: providerToken || loadProviderToken() })
  },
  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email, password, isStudent) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator.' }

    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (!data?.user) throw new Error('Failed to retrieve user data.')

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()
      const actualRole = adminData ? 'admin' : 'student'

      if ((isStudent && actualRole === 'admin') || (!isStudent && actualRole === 'student')) {
        await supabase.auth.signOut()
        return { error: 'Invalid login portal for your role type. Please switch tabs.' }
      }

      set({ user: data.user, role: actualRole })
      return { success: true, role: actualRole }
    } catch (error) {
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

    try {
      // FORCE SIGN OUT FIRST to clear any stale/stuck sessions
      console.log('Force clearing existing session before OAuth...')
      clearProviderToken()
      await supabase.auth.signOut()

      const options = {
        redirectTo: window.location.origin + '/auth/callback'
      }

      if (provider === 'google') {
        // Only request basic profile/email scopes (no sensitive permissions)
        // This allows the OAuth app to be published without Google verification
        options.queryParams = {
          prompt: 'select_account',
          hd: 'pccoepune.org',
          access_type: 'offline'
        }
      }

      console.log('Initiating OAuth login...', { provider, options })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: options
      })

      if (error) throw error

      if (data?.url) {
        console.log('Redirecting to OAuth provider:', data.url)
        window.location.href = data.url
      }

      return { success: true, data }
    } catch (error) {
      console.error('OAuth Error:', error)
      return { error: error.message || 'Error occurred during authentication initiation.' }
    }
  },

  signUp: async (email, password, fullName, prnNumber, branch, currentYear) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator.' }

    set({ isLoading: true })
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      if (!authData?.user) throw new Error('Failed to retrieve user data.')

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
    clearProviderToken()
    await supabase.auth.signOut()
    set({ user: null, role: null, providerToken: null, isLoading: false })
  }
}))
