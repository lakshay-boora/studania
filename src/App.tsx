import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import SubjectPage from './pages/SubjectPage'
import ChapterPage from './pages/ChapterPage'
import DoubtHub from './pages/DoubtHub'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate text-sm">
      Loading Studania…
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/subjects/:subjectSlug" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
      <Route path="/subjects/:subjectSlug/:chapterSlug" element={<ProtectedRoute><ChapterPage /></ProtectedRoute>} />
      <Route path="/doubts" element={<ProtectedRoute><DoubtHub /></ProtectedRoute>} />
    </Routes>
  )
}
