import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import { useAuth } from '../context/AuthContext'

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'][score]
  return { score, label }
}

export default function SignupPage() {
  const { currentUser, signup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => passwordStrength(password), [password])

  if (currentUser) return <Navigate to="/chat" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const result = await signup(name, email, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Unable to create your account.')
      return
    }
    navigate('/chat', { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your Aalone account"
      subtitle="It takes under a minute — then the care team is one message away."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="auth-error" role="alert">{error}</p>}

        <label className="auth-field">
          <span>Full name</span>
          <div className="auth-input">
            <svg width="18" height="18"><use href="/icons.svg#user-icon" /></svg>
            <input
              type="text"
              autoComplete="name"
              placeholder="Ada Okafor"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              required
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Email</span>
          <div className="auth-input">
            <svg width="18" height="18"><use href="/icons.svg#chat-icon" /></svg>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          {password.length > 0 && (
            <span className={`auth-strength strength-${strength.score}`}>
              <i /><i /><i /><i /><i />
              <em>{strength.label}</em>
            </span>
          )}
        </label>

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-fineprint">
          By continuing you agree to Aalone’s Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  )
}
