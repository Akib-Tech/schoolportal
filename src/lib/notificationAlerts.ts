// Best-effort browser-side alerting for new chat messages: a synthesized
// chime, an OS notification, and a flashing tab title. Every path is guarded
// and degrades silently — none of this needs a backend or a service worker,
// and it only works while an Aalone tab is open somewhere.

/* ------------------------------------------- currently-open conversation */

// The chat pages register the thread on screen here so the alerter can stay
// quiet for a message that just landed in the conversation you're reading.
let activeConversationId: string | null = null

export function setActiveConversation(id: string | null) {
  activeConversationId = id
}

export function getActiveConversation(): string | null {
  return activeConversationId
}

/* ------------------------------------------------------------------ chime */

let audioCtx: AudioContext | null = null
let audioUnlocked = false

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

/**
 * Call from a user-gesture handler. Creating/resuming the AudioContext here
 * (rather than lazily on the first message) keeps the browser from logging an
 * autoplay warning and guarantees the chime is audible later.
 */
export function unlockAudio() {
  const ctx = ensureAudio()
  if (!ctx) return
  ctx.resume().then(() => {
    audioUnlocked = true
  }).catch(() => {})
}

/** A short two-note "ding" via the Web Audio API — no asset to ship. */
export function playChime() {
  if (!audioUnlocked) return // no user gesture yet — a silent no-op beats a console warning
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
