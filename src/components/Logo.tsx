import './logo.css'
import aaloneLogo from '../assets/images/Aalone_Logo.png'

interface LogoProps {
  variant?: 'dark' | 'light'
}

export default function Logo({ variant = 'dark' }: LogoProps) {
  return (
    <div className={`logo logo-${variant}`}>
      <img className="logo-mark" src={aaloneLogo} alt="Aalone logo" />
      <span className="logo-text">
        <strong>Aalone</strong>
        <small>Good Health and Wellbeing</small>
      </span>
    </div>
  )
}
