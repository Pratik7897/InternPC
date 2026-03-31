import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'student' | 'admin'
  providerToken: null, // Google OAuth Token
  isLoading: true, // Start true while we check initial session
  
  // Method to check active session on refresh
  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Determine if admin or student
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle()
      set({ user: session.user, role: adminData ? 'admin' : 'student', providerToken: session.provider_token, isLoading: false })
    } else {
      set({ user: null, role: null, providerToken: null, isLoading: false })
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
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
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

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
    set({ isLoading: true })
    try {
      const options = {
        redirectTo: window.location.origin + '/student/dashboard'
      }

      // If logging in with google, explicitly request permission to read their emails
      // so we can parse them for internships!
      if (provider === 'google') {
        options.scopes = 'https://www.googleapis.com/auth/gmail.readonly'
        options.queryParams = {
          prompt: 'consent', // Forces Google to actually ask for the new scope
          hd: 'pccoepune.org' // Restrict to PCCOE institutional emails
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: options
      })
      if (error) throw error
    } catch (error) {
      return { error: error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password, fullName, prnNumber, branch, currentYear) => {
    set({ isLoading: true })
    try {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      // 2. Create the associated profile record in the database
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          prn_number: prnNumber,
          branch: branch,
          current_year: currentYear
        })
        if (profileError) throw profileError
      }

      return { success: true }
    } catch (error) {
      return { error: error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    await supabase.auth.signOut()
    set({ user: null, role: null, isLoading: false })
  }
}))
