import './logo.css'

interface LogoProps {
  variant?: 'dark' | 'light'
}

export default function Logo({ variant = 'dark' }: LogoProps) {
  return (
    <div className={`logo logo-${variant}`}>
      <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="url(#logo-grad)" />
        <path
          fill={variant === 'light' ? '#123c30' : '#ffffff'}
          d="M20 6c-4.5 0-8 3.9-8 8.6 0 3.1.9 4.7 1.7 6.1.6 1.1 1.1 2 1.1 3.4v6.4c0 1 .8 1.5 1.7 1.2l2-.7c.5-.2 1-.2 1.5 0l2 .7c.9.3 1.7-.2 1.7-1.2v-3.2"
        />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0" stopColor="#1c6b4f" />
            <stop offset="1" stopColor="#0c2a22" />
          </linearGradient>
        </defs>
      </svg>
      <span className="logo-text">
        <strong>Aalone</strong>
        <small>Good Health and Wellbeing</small>
      </span>
    </div>
  )
}
