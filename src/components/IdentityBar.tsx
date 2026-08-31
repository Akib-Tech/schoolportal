import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './identityBar.css'

const ROLE_LABEL: Record<string, string> = {
  user: 'User',
  rep: 'Care Rep',
  superadmin: 'Super Admin',
}

export default function IdentityBar() {
  const { currentUser, people, switchUser } = useAuth()

  return (
    <div className="identity-bar">
      <div className="wrap identity-bar-inner">
        <span className="identity-bar-tag">Prototype mode</span>

        <label className="identity-bar-select">
          Acting as
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {ROLE_LABEL[p.role]}
              </option>
            ))}
          </select>
        </label>

        <nav className="identity-bar-links">
          <Link to="/">Home</Link>
          <Link to="/chat">Chat</Link>
          {(currentUser.role === 'rep' || currentUser.role === 'superadmin') && (
            <Link to="/rep">Rep Inbox</Link>
          )}
          {currentUser.role === 'superadmin' && <Link to="/admin">Admin</Link>}
        </nav>
      </div>
    </div>
  )
}
