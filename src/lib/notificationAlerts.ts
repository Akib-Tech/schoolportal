// Best-effort browser-side alerting for new chat messages: a synthesized
// chime, an OS notification, and a flashing tab title. Every path is guarded
// and degrades silently — none of this needs a backend or a service worker,
// and it only works while an Aalone tab is open somewhere.

/* ------------------------------------------------------------------ chime */

let audioCtx: AudioContext | null = null

function ensureAudio(): AudioContext | null {
  if (audioCtx) return audioCtx
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  } catch {
    return null
  }
  return audioCtx
}

/** Call from a user-gesture handler so the chime is allowed to play later. */
export function unlockAudio() {
  ensureAudio()?.resume().catch(() => {})
}

/** A short two-note "ding" via the Web Audio API — no asset to ship. */
export function playChime() {
  const ctx = ensureAudio()
  if (!ctx) return
  ctx.resume().catch(() => {})
  const now = ctx.currentTime
  ;[880, 1174.66].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.14
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.32)
  })
}

/* ------------------------------------------------------- OS notification */

function canNotify(): boolean {
  return typeof Notification !== 'undefined'
}

/** Ask for notification permission — call from a user gesture. */
export function ensureNotifyPermission() {
  if (canNotify() && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

export function showNotification(title: string, body: string, onClick?: () => void) {
  if (!canNotify() || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, icon: '/aalone_Logo.png', tag: 'aalone-chat' })
    n.onclick = () => {
      window.focus()
      onClick?.()
      n.close()
    }
  } catch {
    // Some browsers disallow the constructor outside a service worker; ignore.
  }
}

/* ---------------------------------------------------------- tab title flash */

let flashTimer: number | null = null
let baseTitle = ''

export function flashTitle(message: string) {
  if (flashTimer !== null) return
  baseTitle = document.title
  let showMessage = true
  flashTimer = window.setInterval(() => {
    document.title = showMessage ? message : baseTitle
    showMessage = !showMessage
  }, 1000)
}

export function stopFlashTitle() {
  if (flashTimer === null) return
  window.clearInterval(flashTimer)
  flashTimer = null
  document.title = baseTitle
}
