import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../lib/chatStore'

export default function LoginPage() {
  const { currentUser, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  if (currentUser) {
    return <Navigate to={location.state?.from ?? '/chat'} replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error ?? 'Unable to sign in.')
      return
    }
    navigate(location.state?.from ?? '/chat', { replace: true })
  }

  function applyDemo(demo: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(demo.email)
    setPassword(demo.password)
    setError(null)
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Aalone"
      subtitle="Pick up your support conversations right where you left off."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="auth-error" role="alert">{error}</p>}

        <label className="auth-field">
          <span>Email</span>
          <div className="auth-input">
            <svg width="18" height="18"><use href="/icons.svg#user-icon" /></svg>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              required
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-input">
            <svg width="18" height="18"><use href="/icons.svg#shield-icon" /></svg>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              required
            />
            <button
              type="button"
              className="auth-reveal"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button type="submit" className="btn btn-primary auth-submit">
          Sign in
        </button>
      </form>

      <div className="auth-demo">
        <button type="button" className="auth-demo-toggle" onClick={() => setShowDemo((v) => !v)}>
          {showDemo ? 'Hide demo logins' : 'Use a demo login'}
        </button>
        {showDemo && (
          <ul>
            {DEMO_ACCOUNTS.map((d) => (
              <li key={d.email}>
                <button type="button" onClick={() => applyDemo(d)}>
                  <strong>{d.label}</strong>
                  <span>{d.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthShell>
  )
}
