import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addPerson, getPeople, setRole, type Role } from '../lib/chatStore'
import { useLiveStore } from '../lib/useLiveStore'
import './adminPage.css'

const ROLE_LABEL: Record<Role, string> = {
  user: 'User',
  rep: 'Customer Care Rep',
  superadmin: 'Super Admin',
}

export default function AdminPage() {
  const { currentUser } = useAuth()
  const people = useLiveStore(() => getPeople(), [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  if (!currentUser || currentUser.role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    addPerson(name.trim(), email.trim(), 'user')
    setName('')
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

        <form className="admin-add-form" onSubmit={handleAdd}>
          <h2>Add a person</h2>
          <div className="admin-add-fields">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}
