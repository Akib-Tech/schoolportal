import heroPhoto from '../assets/images/hero_Photo.png'
import './hero.css'

const AVATAR_COLORS = ['#8bc540', '#1c6b4f', '#e0a458', '#5b8fd6']

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">You matter. We're here.</span>
          <h1 className="hero-title">
            Feel heard.
            <br />
            Feel supported.
            <br />
            <span className="accent">Live healthier.</span>
          </h1>
          <p className="hero-desc">
            Connect with empathetic listeners, expert coaches, and licensed
            psychologists anytime you need support. Because everyone deserves
            to feel heard.
          </p>

          <div className="hero-cta">
            <a href="#support" className="btn btn-primary">
              <svg className="icon" width="18" height="18"><use href="/icons.svg#chat-icon" /></svg>
              Start a Conversation
            </a>
            <a href="#how-it-works" className="btn btn-outline">
              <svg className="icon" width="16" height="16"><use href="/icons.svg#play-icon" /></svg>
              How It Works
            </a>
          </div>

          <div className="hero-social-proof">
            <div className="avatar-stack">
              {AVATAR_COLORS.map((c) => (
                <span key={c} className="avatar-dot" style={{ background: c }} />
              ))}
            </div>
            <div className="hero-rating">
              <div className="stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14"><use href="/icons.svg#star-icon" /></svg>
                ))}
              </div>
              <p>
                <strong>10,000+ people</strong> have found support on Aalone
              </p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob" aria-hidden="true" />
          <div className="hero-photo-frame">
            <img src={heroPhoto} alt="Woman smiling with her hand on her chest, feeling calm and supported" />
          </div>

          <div className="chat-card">
            <div className="chat-card-head">
              <p>How can we support you today?</p>
              <svg width="16" height="16" className="chat-card-menu"><use href="/icons.svg#chevron-icon" /></svg>
            </div>

            <div className="chat-bubble chat-bubble-user">
              <img src={heroPhoto} alt="" className="chat-avatar" />
              <div>
                <div className="bubble">I've been feeling stressed and overwhelmed lately.</div>
                <span className="chat-time">10:30 AM</span>
              </div>
            </div>

            <div className="chat-bubble chat-bubble-reply">
              <div className="bubble bubble-reply">
                I'm here for you. Let's take it one step at a time. 💚
              </div>
              <span className="chat-time">10:31 AM ✓</span>
            </div>

            <div className="chat-input">
              <span>Type a message...</span>
              <button type="button" aria-label="Send">
                <svg width="16" height="16"><use href="/icons.svg#send-icon" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
