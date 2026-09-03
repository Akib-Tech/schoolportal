import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatTime } from '../lib/chatStore'
import {
  ensureNotifyPermission,
  flashTitle,
  playChime,
  showNotification,
  stopFlashTitle,
  unlockAudio,
} from '../lib/notificationAlerts'
import { useNotifications } from '../lib/useChatData'
import './notificationBell.css'

const MUTE_KEY = 'aalone_notif_muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const { items, total } = useNotifications()
  const [open, setOpen] = useState(false)
  const [muted, setMuted] = useState(readMuted)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const isStaff = currentUser?.role === 'rep' || currentUser?.role === 'superadmin'

  function openConversation(conversationId: string) {
    setOpen(false)
    navigate(isStaff ? `/rep?c=${conversationId}` : '/chat')
  }

  function toggleMuted() {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0')
      } catch {
        // storage unavailable — the in-memory toggle still applies for this tab
      }
      return next
    })
  }

  // Close the panel on an outside click.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Arm the chime and ask for notification permission on the first interaction.
  useEffect(() => {
    function arm() {
      unlockAudio()
      ensureNotifyPermission()
    }
    window.addEventListener('pointerdown', arm, { once: true })
    window.addEventListener('keydown', arm, { once: true })
    return () => {
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [])

  // Stop the title flash the moment the viewer returns to the tab.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') stopFlashTitle()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', stopFlashTitle)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', stopFlashTitle)
      stopFlashTitle()
    }
  }, [])

  // Alert when a genuinely newer message arrives while the tab isn't focused.
  const latestAt = items.reduce((max, it) => Math.max(max, it.lastMessage.createdAt), 0)
  const alertedAt = useRef<number | null>(null)
  useEffect(() => {
    if (latestAt === 0) return
    if (alertedAt.current === null) {
      alertedAt.current = latestAt // don't alert for the backlog already present on load
      return
    }
    if (latestAt <= alertedAt.current) return
    alertedAt.current = latestAt

    const focused = document.visibilityState === 'visible' && document.hasFocus()
    if (focused) return

    const newest = items[0] // items are sorted newest-first
    if (!newest) return
    const label = isStaff
      ? `New message from ${newest.personName}`
      : 'New reply from Aalone Support'

    if (!muted) playChime()
    showNotification(label, newest.lastMessage.text, () =>
      navigate(isStaff ? `/rep?c=${newest.conversationId}` : '/chat'),
    )
    flashTitle(`● ${label}`)
  }, [latestAt, items, isStaff, muted, navigate])

  if (!currentUser) return null

  return (
    <div className="notif-bell" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        aria-label={total > 0 ? `Notifications, ${total} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" aria-hidden>
          <use href="/icons.svg#bell-icon" />
        </svg>
        {total > 0 && <span className="notif-bell-badge">{total > 9 ? '9+' : total}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-panel-head">Notifications</div>
          {items.length === 0 ? (
            <p className="notif-panel-empty">You&rsquo;re all caught up.</p>
          ) : (
            <ul>
              {items.map((it) => (
                <li key={it.conversationId}>
                  <button type="button" onClick={() => openConversation(it.conversationId)}>
                    <span className="notif-row-top">
                      <span className="notif-row-name">{it.personName}</span>
                      <span className="notif-row-time">{formatTime(it.lastMessage.createdAt)}</span>
                    </span>
                    <span className="notif-row-text">{it.lastMessage.text}</span>
                    <span className="notif-row-count">
                      {it.unreadCount} new message{it.unreadCount === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="notif-panel-mute"
            aria-pressed={!muted}
            onClick={toggleMuted}
          >
            <svg width="15" height="15" aria-hidden>
              <use href={`/icons.svg#${muted ? 'bell-off-icon' : 'bell-icon'}`} />
            </svg>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      )}
    </div>
  )
}
