import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

// Layouts implies some wrapping components
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import DirectoryPage from './pages/public/DirectoryPage'
import StudentProfilePublicPage from './pages/public/StudentProfilePublicPage'
import InternshipsPublicPage from './pages/public/InternshipsPublicPage'
import AuthCallback from './pages/public/AuthCallback'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import ProfileForm from './pages/student/ProfileForm'
import UploadCenter from './pages/student/UploadCenter'
import BrowseInternships from './pages/student/BrowseInternships'
import MyApplications from './pages/student/MyApplications'
import Notifications from './pages/student/Notifications'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsManagement from './pages/admin/StudentsManagement'
import InternshipsManagement from './pages/admin/InternshipsManagement'
import ApplicationsManagement from './pages/admin/ApplicationsManagement'
import EmailCenter from './pages/admin/EmailCenter'
import AnnouncementsManagement from './pages/admin/AnnouncementsManagement'
import ExportData from './pages/admin/ExportData'
import { useAuthStore } from './store/authStore'

// Protected Route Wrapper
const ProtectedRoute = ({ role, children }) => {
  const { user, role: userRole } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/login" replace />
  
  return children
}

function App() {
  const { checkSession, isLoading } = useAuthStore()

  useEffect(() => {
    checkSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary font-medium animate-pulse">Initializing Portal Edge...</p>
      </div>
    )
  }

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ className: 'glass' }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/directory/:student_id" element={<StudentProfilePublicPage />} />
        <Route path="/internships" element={<InternshipsPublicPage />} />

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<ProfileForm />} />
          <Route path="upload" element={<UploadCenter />} />
          <Route path="internships" element={<BrowseInternships />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="notifications" element={<Notifications />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentsManagement />} />
          <Route path="internships" element={<InternshipsManagement />} />
          <Route path="applications" element={<ApplicationsManagement />} />
          <Route path="email" element={<EmailCenter />} />
          <Route path="announcements" element={<AnnouncementsManagement />} />
          <Route path="export" element={<ExportData />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
