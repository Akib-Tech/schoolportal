import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  billableMinutes,
  formatClock,
  formatMoney,
  getSession,
  pauseSession,
  resumeSession,
  sessionElapsedMs,
  stopSession,
  SUPPORT_RATE_PER_MINUTE,
} from '../lib/chatStore'
import { useLiveStore } from '../lib/useLiveStore'
import './chatTimer.css'

const STATUS_LABEL = {
  active: 'Live',
  paused: 'Paused',
  ended: 'Ended',
} as const

export default function ChatTimer({ conversationId }: { conversationId: string }) {
  const { currentUser } = useAuth()
  const session = useLiveStore(() => getSession(conversationId), [conversationId])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (session?.status !== 'active') return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session?.status])

  if (!session) {
    return (
      <div className="chat-timer is-idle">
        <span className="chat-timer-main">
          <span className="chat-timer-dot" />
          <span className="chat-timer-label">Timer starts with your first message</span>
        </span>
        <span className="chat-timer-rate">{formatMoney(SUPPORT_RATE_PER_MINUTE)} / min</span>
      </div>
    )
  }

  const elapsedMs = sessionElapsedMs(session, now)
  const minutes = billableMinutes(elapsedMs)
  const charge = minutes * session.ratePerMinute

  return (
    <div className={`chat-timer is-${session.status}`}>
      <span className="chat-timer-main">
        <span className="chat-timer-dot" />
        <span className={`chat-timer-status status-${session.status}`}>
          {STATUS_LABEL[session.status]}
        </span>
        <span className="chat-timer-clock">{formatClock(elapsedMs)}</span>
      </span>

      <span className="chat-timer-meter">
        <span className="chat-timer-billed">
          {minutes} billable min{minutes === 1 ? '' : 's'}
        </span>
        <span className="chat-timer-charge">
          ≈ {formatMoney(charge)}
          <span className="chat-timer-rate-hint"> · {formatMoney(session.ratePerMinute)}/min</span>
        </span>
      </span>

      {currentUser && session.status !== 'ended' && (
        <span className="chat-timer-actions">
          {session.status === 'active' ? (
            <button
              type="button"
              className="chat-timer-btn"
              onClick={() => pauseSession(conversationId, currentUser)}
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="chat-timer-btn is-primary"
              onClick={() => resumeSession(conversationId, currentUser)}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className="chat-timer-btn is-stop"
            onClick={() => {
              if (
                window.confirm(
                  'End this chat? Billable time is finalized and the conversation is closed.',
                )
              ) {
                stopSession(conversationId, currentUser)
              }
            }}
          >
            End chat
          </button>
        </span>
      )}

      {session.status === 'ended' && (
        <span className="chat-timer-actions chat-timer-final">
          Final: {minutes} min · {formatMoney(charge)}
        </span>
      )}
    </div>
  )
}
