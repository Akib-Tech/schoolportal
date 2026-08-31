import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import IdentityBar from './components/IdentityBar'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import RepInboxPage from './pages/RepInboxPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <IdentityBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/rep" element={<RepInboxPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
