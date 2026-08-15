import { useState } from 'react'
import Logo from './Logo'
import './header.css'

const NAV_LINKS = ['Home', 'How It Works', 'Experts', 'Resources', 'About Us']

export default function Header() {
  const [open, setOpen] = useState(false)

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
          <div className="site-nav-actions">
            <a href="#" className="btn btn-outline">Log In</a>
            <a href="#" className="btn btn-primary">Get Started</a>
          </div>
        </nav>

        <div className="site-header-actions">
          <a href="#" className="btn btn-outline">Log In</a>
          <a href="#" className="btn btn-primary">Get Started</a>
        </div>

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
