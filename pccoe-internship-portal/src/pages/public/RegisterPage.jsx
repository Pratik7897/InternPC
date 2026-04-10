import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { isSupabaseConfigured } from '../../lib/supabase'
import ThemeToggle from '../../components/ui/ThemeToggle'

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").endsWith("@pccoepune.org", "Must be a PCCOE email address"),
  prn: z.string().min(8, "Invalid PRN format"),
  branch: z.string().min(1, "Branch is required"),
  year: z.string().min(1, "Year is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithOAuth } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.error("FATAL: Supabase is NOT configured. Google registration will fail.")
    }
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const res = await signUp(data.email, data.password, data.fullName, data.prn, data.branch, data.year)
      
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Registration successful! You can now log in.")
        navigate('/login')
      }
    } catch (error) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background py-12 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-accent-blue/5 dark:bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-300"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        {!isSupabaseConfigured && (
          <div className="bg-red-500/20 dark:bg-red-500/20 border border-red-500 dark:border-red-500 text-red-200 dark:text-red-200 p-4 rounded-lg mb-6 text-sm text-center transition-colors duration-300">
            <p className="font-bold mb-1 underline">CONFIGURATION ERROR</p>
            Supabase keys are missing in Vercel. Google Login will NOT work until you add VITE_SUPABASE_URL to your environment variables.
          </div>
        )}

        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <Link to="/" className="text-center block mb-8">
          <div className="w-12 h-12 mx-auto bg-background/80 dark:bg-white/10 rounded-xl flex items-center justify-center border border-border dark:border-white/20 mb-4 transition-all duration-300">
            <span className="text-xl font-heading font-bold text-accent-blue">PC</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Student Registration</h1>
          <p className="text-text-secondary mt-1">Create your PCCOE placement account</p>
        </Link>

        <div className="glass-card p-8 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" className="mt-1" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="email">College Email (@pccoepune.org)</Label>
                <Input id="email" type="email" placeholder="john.doe22@pccoepune.org" className="mt-1" {...register('email')} />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="prn">PRN Number</Label>
                <Input id="prn" placeholder="121BEXXX" className="mt-1" {...register('prn')} />
                {errors.prn && <p className="text-xs text-red-400 mt-1">{errors.prn.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="branch">Branch</Label>
                <select 
                  id="branch" 
                  className="flex h-10 w-full rounded-md border border-border dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1 transition-colors duration-300"
                  {...register('branch')}
                >
                  <option value="" disabled className="bg-background dark:bg-background">Select Branch</option>
                  <option value="CSE" className="bg-background dark:bg-background">Computer Science</option>
                  <option value="IT" className="bg-background dark:bg-background">Information Technology</option>
                  <option value="ENTC" className="bg-background dark:bg-background">E&TC</option>
                  <option value="MECH" className="bg-background dark:bg-background">Mechanical</option>
                  <option value="CIVIL" className="bg-background dark:bg-background">Civil</option>
                  <option value="AIDS" className="bg-background dark:bg-background">AI & Data Science</option>
                </select>
                {errors.branch && <p className="text-xs text-red-400 mt-1">{errors.branch.message}</p>}
              </div>
              <div>
                <Label htmlFor="year">Current Year</Label>
                <select 
                  id="year" 
                  className="flex h-10 w-full rounded-md border border-border dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1 transition-colors duration-300"
                  {...register('year')}
                >
                  <option value="" disabled className="bg-background dark:bg-background">Select Year</option>
                  <option value="FE" className="bg-background dark:bg-background">First Year (FE)</option>
                  <option value="SE" className="bg-background dark:bg-background">Second Year (SE)</option>
                  <option value="TE" className="bg-background dark:bg-background">Third Year (TE)</option>
                  <option value="BE" className="bg-background dark:bg-background">Final Year (BE)</option>
                </select>
                {errors.year && <p className="text-xs text-red-400 mt-1">{errors.year.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 6 characters" className="mt-1" {...register('password')} />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" className="mt-1" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            
            <Button type="submit" className="w-full shadow-[var(--glow)] mt-4" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 relative flex items-center">
            <div className="flex-grow border-t border-border dark:border-white/10 transition-colors duration-300"></div>
            <span className="flex-shrink-0 mx-4 text-text-secondary text-xs uppercase tracking-wider">Or register with</span>
            <div className="flex-grow border-t border-border dark:border-white/10 transition-colors duration-300"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="glass dark:glass border-border dark:border-white/10 hover:bg-accent-blue/5 dark:hover:bg-white/5 gap-2 transition-all duration-300"
              onClick={async (e) => {
                e.preventDefault()
                console.log("Google registration clicked...")
                const res = await signInWithOAuth('google')
                if (res && res.error) {
                  console.error("OAuth Error:", res.error)
                  toast.error(res.error)
                }
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="glass dark:glass border-border dark:border-white/10 hover:bg-accent-blue/5 dark:hover:bg-white/5 gap-2 transition-all duration-300"
              onClick={async () => {
                const res = await signInWithOAuth('github')
                if (res && res.error) {
                  toast.error(res.error)
                }
              }}
            >
              <svg className="w-5 h-5 text-text-primary dark:text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-text-secondary border-t border-border dark:border-white/5 pt-6 transition-colors duration-300">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-blue hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
