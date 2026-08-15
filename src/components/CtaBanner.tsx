import './ctaBanner.css'

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="wrap cta-banner-inner">
        <div className="cta-banner-copy">
          <span className="cta-banner-icon">
            <svg width="20" height="20"><use href="/icons.svg#chat-icon" /></svg>
          </span>
          <p>Your well-being is our priority.</p>
        </div>
        <div className="cta-banner-actions">
          <a href="#support" className="btn btn-primary">
            <svg width="16" height="16"><use href="/icons.svg#chat-icon" /></svg>
            Start a Conversation
          </a>
          <a href="#" className="btn btn-outline">
            <svg width="16" height="16"><use href="/icons.svg#chevron-icon" /></svg>
            Download the App
          </a>
        </div>
      </div>
    </section>
  )
}
