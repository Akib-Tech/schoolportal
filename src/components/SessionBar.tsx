import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import './sessionBar.css'

const ROLE_LABEL: Record<string, string> = {
  user: 'Member',
  rep: 'Care Rep',
  superadmin: 'Super Admin',
}

export default function SessionBar() {
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!currentUser) return null
  // The auth screens carry their own layout; keep the bar out of them.
  if (location.pathname === '/login' || location.pathname === '/signup') return null

  const isStaff = currentUser.role === 'rep' || currentUser.role === 'superadmin'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="session-bar">
      <div className="wrap session-bar-inner">
        <span className="session-bar-who">
          <span className="session-bar-avatar" aria-hidden>
            {currentUser.name.charAt(0)}
          </span>
          <span className="session-bar-name">{currentUser.name}</span>
          <span className={`session-bar-role role-${currentUser.role}`}>
            {ROLE_LABEL[currentUser.role]}
          </span>
        </span>

        <nav className="session-bar-links">
          <NotificationBell />
          <Link to="/">Home</Link>
          <Link to="/chat">Chat</Link>
          {isStaff && <Link to="/rep">Rep Inbox</Link>}
          {currentUser.role === 'superadmin' && <Link to="/admin">Admin</Link>}
          <button type="button" className="session-bar-logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </div>
    </div>
  )
}
