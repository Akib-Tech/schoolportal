import Logo from './Logo'
import './footer.css'

const COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'How It Works', 'Aalone Ring', 'Pricing'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Blog', 'Contact Us'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Privacy Policy', 'Terms of Service'],
  },
]

const SOCIALS = ['instagram-icon', 'facebook-icon', 'twitter-icon', 'linkedin-icon']

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div className="footer-col footer-brand">
          <Logo variant="light" />
        </div>

        {COLUMNS.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}

        <div className="footer-col footer-social">
          <h4>Follow Us</h4>
          <div className="footer-social-icons">
            {SOCIALS.map((icon) => (
              <a href="#" key={icon} aria-label={icon.replace('-icon', '')}>
                <svg width="16" height="16"><use href={`/icons.svg#${icon}`} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap footer-bottom">
        <p>© 2026 Aalone. All rights reserved.</p>
      </div>
    </footer>
  )
}
