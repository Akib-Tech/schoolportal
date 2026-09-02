import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import type { Role } from './lib/chatStore'
import SessionBar from './components/SessionBar'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import RepInboxPage from './pages/RepInboxPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import './App.css'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { currentUser, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) return null
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/chat" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <SessionBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/rep"
          element={
            <RequireAuth roles={['rep', 'superadmin']}>
              <RepInboxPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={['superadmin']}>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
