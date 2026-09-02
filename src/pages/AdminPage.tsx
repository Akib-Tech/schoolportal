import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { invitePerson, setRole, type Role } from '../lib/chatStore'
import { usePeople } from '../lib/useChatData'
import './adminPage.css'

const ROLE_LABEL: Record<Role, string> = {
  user: 'User',
  rep: 'Customer Care Rep',
  superadmin: 'Super Admin',
}

export default function AdminPage() {
  const { currentUser } = useAuth()
  const people = usePeople()
  const [email, setEmail] = useState('')

  if (!currentUser || currentUser.role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    invitePerson(email.trim(), 'rep')
    setEmail('')
  }

  return (
    <div className="admin-page">
      <div className="wrap admin-page-inner">
        <h1>Manage customer care access</h1>
        <p className="admin-page-sub">
          Promote a user to Customer Care Rep so they can reply to support chats. Reps reply
          under the shared "Aalone Support" identity.
        </p>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>
                  <span className={`role-badge role-${p.role}`}>{ROLE_LABEL[p.role]}</span>
                </td>
                <td className="admin-table-actions">
                  {p.role === 'superadmin' ? (
                    <span className="admin-table-muted">—</span>
                  ) : p.role === 'rep' ? (
                    <button type="button" className="btn btn-outline" onClick={() => setRole(p.id, 'user')}>
                      Remove rep role
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setRole(p.id, 'rep')}>
                      Make customer care rep
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="admin-add-form" onSubmit={handleInvite}>
          <h2>Invite a customer care rep</h2>
          <p className="admin-page-sub">
            Enter an email that hasn't signed up yet — they'll get the rep role automatically
            once they create their account. Already signed up? Use the table above instead.
          </p>
          <div className="admin-add-fields">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Invite</button>
          </div>
        </form>
      </div>
    </div>
  )
}
