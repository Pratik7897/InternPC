import { Outlet } from 'react-router-dom'
import StudentSidebar from './StudentSidebar'
import Header from './Header'

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <StudentSidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto custom-scrollbar">
        <Header userRole="student" />
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
