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
  providerToken: loadProviderToken(), // Restore from localStorage immediately
  isLoading: true, // Start true while we check initial session
  profileCompletion: 0, // 0-100, updated after profile save
  setProfileCompletion: (pct) => set({ profileCompletion: pct }),

  // Method to check active session on refresh
  checkSession: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, providerToken: null, isLoading: false })
      return
    }

    try {
      // Add a timeout so the app doesn't hang infinitely if Supabase is down or unreachable
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: new Error('Network Timeout') }), 3000))
      
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise])
      const session = data?.session

      if (error) {
        console.warn('Session check error or timeout:', error)
        // If the refresh token is invalid/expired, force sign out and clear storage
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token') || error.message?.includes('Network Timeout')) {
          console.warn('Stale token or timeout detected — clearing session.')
          // Do not await signOut if it's a timeout, it will just hang again
          supabase.auth.signOut().catch(() => {})
          clearProviderToken()
          set({ user: null, providerToken: null, isLoading: false })
          return
        }
      }

      if (session?.user) {
        const freshToken = session.provider_token || loadProviderToken()
        if (session.provider_token) {
          saveProviderToken(session.provider_token)
        }

        set({
          user: session.user,
          providerToken: freshToken,
          isLoading: false
        })
      } else {
        clearProviderToken()
        set({ user: null, providerToken: null, isLoading: false })
      }
    } catch (err) {
      console.error('Initial session check failed:', err)
      // On any unrecoverable auth error, wipe everything and let user re-login
      clearProviderToken()
      await supabase.auth.signOut().catch(() => {})
      set({ user: null, providerToken: null, isLoading: false })
    }

    // Only register the auth state listener ONCE globally
    if (!authListenerRegistered) {
      authListenerRegistered = true
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event)
        if (event === 'SIGNED_OUT') {
          clearProviderToken()
          set({ user: null, providerToken: null })
          return
        }
        if (session?.user) {
          // Persist fresh token if available
          if (session.provider_token) {
            saveProviderToken(session.provider_token)
          }
          const token = session.provider_token || loadProviderToken()

          set({
            user: session.user,
            providerToken: token
          })
        } else {
          clearProviderToken()
          set({ user: null, providerToken: null })
        }
      })
    }
  },

  setUser: (user, providerToken = null) => {
    if (providerToken) saveProviderToken(providerToken)
    set({ user, providerToken: providerToken || loadProviderToken() })
  },
  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator.' }

    // Validate email domain - only @pccoepune.org users allowed
    if (!email || !email.endsWith('@pccoepune.org')) {
      return { error: 'Access denied. Only @pccoepune.org email addresses are allowed.' }
    }

    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (!data?.user) throw new Error('Failed to retrieve user data.')

      set({ user: data.user })
      return { success: true }
    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. If you signed up with Google, please use the "Sign in with Google" button instead.' }
      }
      return { error: error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithOAuth: async (provider, customOptions = {}) => {
    if (!isSupabaseConfigured) return { error: 'Database connection missing. Contact administrator. Ensure Vercel environment variables are set.' }

    try {
      // FORCE SIGN OUT FIRST to clear any stale/stuck sessions
      console.log('Force clearing existing session before OAuth...')
      clearProviderToken()
      await supabase.auth.signOut()

      const options = {
        redirectTo: window.location.origin + '/auth/callback',
        ...customOptions
      }

      if (provider === 'google') {
        // Consolidated login: Request full Gmail permissions alongside basic profile info
        // This avoids the "double login" UX but will show the Google Unverified App warning 
        // until the app is verified in the Cloud Console.
        options.scopes = 'email profile openid https://www.googleapis.com/auth/gmail.readonly'
        
        options.queryParams = {
          prompt: 'select_account',
          hd: 'pccoepune.org',
          access_type: 'offline', // Request offline access to ensure we get a refresh token
          ...customOptions.queryParams
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

    // Validate email domain - only @pccoepune.org users allowed
    if (!email || !email.endsWith('@pccoepune.org')) {
      return { error: 'Access denied. Only @pccoepune.org email addresses are allowed.' }
    }

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
    set({ user: null, providerToken: null, isLoading: false })
  }
}))
