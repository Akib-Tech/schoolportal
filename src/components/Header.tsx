import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import './header.css'

const NAV_LINKS = ['Home', 'How It Works', 'Experts', 'Resources', 'About Us']

export default function Header() {
  const [open, setOpen] = useState(false)
  const { currentUser } = useAuth()

  const actions = currentUser ? (
    <Link to="/chat" className="btn btn-primary">Open chat</Link>
  ) : (
    <>
      <Link to="/login" className="btn btn-outline">Log In</Link>
      <Link to="/signup" className="btn btn-primary">Get Started</Link>
    </>
  )

  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Logo />

        <nav className={`site-nav ${open ? 'is-open' : ''}`}>
          {NAV_LINKS.map((link, i) => (
            <a key={link} href="#" className={i === 0 ? 'is-active' : ''}>
              {link}
            </a>
          ))}
          <div className="site-nav-actions">{actions}</div>
        </nav>

        <div className="site-header-actions">{actions}</div>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
