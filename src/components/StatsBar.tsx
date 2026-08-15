import './statsBar.css'

const STATS = [
  {
    icon: 'heart-icon',
    title: "You're not alone",
    desc: 'Real people who care are here for you.',
  },
  {
    icon: 'shield-icon',
    title: 'Safe & confidential',
    desc: 'Your conversations are private and secure.',
  },
  {
    icon: 'user-icon',
    title: 'Expert support',
    desc: 'Trained professionals and vetted experts.',
  },
  {
    icon: 'leaf-icon',
    title: 'Better every day',
    desc: 'Support for your mind, mood and growth.',
  },
]

export default function StatsBar() {
  return (
    <section className="stats-bar">
      <div className="wrap">
        <div className="stats-bar-panel">
          {STATS.map((s) => (
            <div className="stat-item" key={s.title}>
              <span className="stat-icon">
                <svg width="20" height="20"><use href={`/icons.svg#${s.icon}`} /></svg>
              </span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
