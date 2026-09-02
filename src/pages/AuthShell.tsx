import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import aaloneLogo from '../assets/images/aalone_Logo.png'
import './auth.css'

const HIGHLIGHTS = [
  'Talk to a real wellbeing specialist in minutes',
  'Your chat history stays private to your account',
  'Transparent, per-minute support — pause any time',
]

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand">
          <img src={aaloneLogo} alt="Aalone" />
          <span>
            <strong>Aalone</strong>
            <small>Good Health and Wellbeing</small>
          </span>
        </Link>

        <div className="auth-aside-body">
          <h2>Support that meets you where you are.</h2>
          <ul>
            {HIGHLIGHTS.map((h) => (
              <li key={h}>
                <svg width="18" height="18"><use href="/icons.svg#check-icon" /></svg>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <figure className="auth-quote">
          <blockquote>
            “I opened the chat on a rough night and someone was just… there. It made a real
            difference.”
          </blockquote>
          <figcaption>— Amara, Aalone member</figcaption>
        </figure>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </main>
    </div>
  )
}
