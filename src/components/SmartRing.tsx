import ringImg from '../assets/images/smart_Ring.png'
import phoneImg from '../assets/images/smartphone_Mockup.png'
import './smartRing.css'

const FEATURES = [
  { icon: 'heart-icon', label: 'Stress Tracking' },
  { icon: 'leaf-icon', label: 'Sleep Monitoring' },
  { icon: 'chevron-icon', label: 'Activity Insights' },
]

const BENEFITS = [
  'Understand your body.',
  'Support your mind.',
  'The ring is available in the app.',
]

export default function SmartRing() {
  return (
    <section className="ring-section">
      <div className="wrap ring-inner">
        <div className="ring-col ring-col-left">
          <span className="eyebrow eyebrow-light">An add-on to understand you better</span>
          <h2 className="ring-title">Aalone Smart Ring</h2>
          <p className="ring-desc">
            Track your stress, sleep and overall well-being with insights
            that help you make informed choices.
          </p>

          <ul className="ring-features">
            {FEATURES.map((f) => (
              <li key={f.label}>
                <svg width="18" height="18"><use href={`/icons.svg#${f.icon}`} /></svg>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          <a href="#" className="btn btn-ghost-light">Learn More About the Ring</a>
        </div>

        <div className="ring-col ring-col-mid">
          <div className="device-stage">
            <img src={ringImg} alt="Aalone smart ring" className="device-ring" />
            <img src={phoneImg} alt="Aalone app showing well-being score of 82" className="device-phone" />
          </div>
        </div>

        <div className="ring-col ring-col-right">
          {BENEFITS.map((b) => (
            <div className="ring-benefit" key={b}>
              <svg width="18" height="18"><use href="/icons.svg#check-icon" /></svg>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
