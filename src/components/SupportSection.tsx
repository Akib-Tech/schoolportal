import './supportSection.css'

const SUPPORT_TYPES = [
  {
    icon: 'ear-icon',
    color: '#e7c9a6',
    title: 'Empathetic Listeners',
    desc: 'Talk to someone who truly listens.',
  },
  {
    icon: 'coach-icon',
    color: '#c7ddb5',
    title: 'Expert Coaches',
    desc: 'Get guidance to build confidence and clarity.',
  },
  {
    icon: 'psych-icon',
    color: '#bcd3ea',
    title: 'Licensed Psychologists',
    desc: 'Professional help for deeper emotional support.',
  },
]

const EXPERTS = [
  { name: 'Tolu A.', role: 'Listener', desc: "I'm here to listen and support you.", rating: '4.9', color: '#e7c9a6' },
  { name: 'Grace M.', role: 'Life Coach', desc: "Let's work together towards your goals.", rating: '4.9', color: '#c7ddb5' },
  { name: 'Dr. Samuel K.', role: 'Psychologist', desc: 'Professional support for your mental health.', rating: '4.9', color: '#bcd3ea' },
]

const TESTIMONIALS = [
  {
    quote: 'I felt truly heard for the first time in a long time. Aalone changed how I see myself.',
    name: 'Ama, Aalone User',
    color: '#e7c9a6',
  },
  {
    quote: 'The coaches helped me stay focused and positive through one of the toughest times.',
    name: 'Kofi, Aalone User',
    color: '#bcd3ea',
  },
]

export default function SupportSection() {
  return (
    <section className="support" id="how-it-works">
      <div className="wrap support-inner">
        <div className="support-col support-col-left">
          <span className="eyebrow">Support that fits you</span>
          <h2 className="support-title">
            Connect. Talk.
            <br />
            <span className="accent">Feel better.</span>
          </h2>
          <p className="support-desc">
            Choose the type of support you need and connect with the right
            expert for your journey.
          </p>

          <ul className="support-types">
            {SUPPORT_TYPES.map((t) => (
              <li key={t.title}>
                <span className="support-type-icon" style={{ background: t.color }}>
                  <svg width="18" height="18"><use href={`/icons.svg#${t.icon}`} /></svg>
                </span>
                <div className="support-type-copy">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
                <svg className="support-type-chevron" width="18" height="18"><use href="/icons.svg#chevron-icon" /></svg>
              </li>
            ))}
          </ul>
        </div>

        <div className="support-col support-col-mid">
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-status">
              <span>9:41</span>
              <span className="phone-status-icons">•••</span>
            </div>
            <div className="phone-screen">
              <h4>Find your support</h4>
              <p className="phone-sub">Who would you like to talk to?</p>

              <div className="phone-tabs">
                <span className="is-active">All</span>
                <span>Listener</span>
                <span>Coach</span>
                <span>Psychologist</span>
              </div>

              <div className="phone-list">
                {EXPERTS.map((e) => (
                  <div className="phone-expert" key={e.name}>
                    <span className="phone-expert-avatar" style={{ background: e.color }}>
                      <svg width="18" height="18"><use href="/icons.svg#user-icon" /></svg>
                    </span>
                    <div className="phone-expert-copy">
                      <div className="phone-expert-name">
                        <strong>{e.name}</strong>
                        <span className="phone-expert-rating">
                          <svg width="10" height="10"><use href="/icons.svg#star-icon" /></svg>
                          {e.rating}
                        </span>
                      </div>
                      <span className="phone-expert-role">{e.role}</span>
                      <p>{e.desc}</p>
                    </div>
                    <span className="phone-expert-online" />
                  </div>
                ))}
              </div>
            </div>

            <div className="phone-tabbar">
              <span><svg width="18" height="18"><use href="/icons.svg#home-icon" /></svg>Home</span>
              <span><svg width="18" height="18"><use href="/icons.svg#chat-icon" /></svg>Chats</span>
              <span><svg width="18" height="18"><use href="/icons.svg#explore-icon" /></svg>Explore</span>
              <span><svg width="18" height="18"><use href="/icons.svg#journal-icon" /></svg>Journal</span>
              <span><svg width="18" height="18"><use href="/icons.svg#profile-icon" /></svg>Profile</span>
            </div>
          </div>
        </div>

        <div className="support-col support-col-right">
          {TESTIMONIALS.map((t) => (
            <div className="testimonial-card" key={t.name}>
              <span className="testimonial-quote-mark">&ldquo;</span>
              <p>{t.quote}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar" style={{ background: t.color }} />
                <span>&mdash; {t.name}</span>
              </div>
            </div>
          ))}

          <div className="crisis-card">
            <div>
              <p className="crisis-title">In a crisis?</p>
              <p className="crisis-desc">
                Get immediate support from trained listeners.
              </p>
              <a href="#" className="crisis-link">
                Connect Now
                <svg width="16" height="16"><use href="/icons.svg#chevron-icon" /></svg>
              </a>
            </div>
            <svg className="crisis-icon" width="34" height="34"><use href="/icons.svg#heart-icon" /></svg>
          </div>
        </div>
      </div>
    </section>
  )
}
