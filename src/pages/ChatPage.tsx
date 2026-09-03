import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ChatTimer from '../components/ChatTimer'
import TypingIndicator from '../components/TypingIndicator'
import { useAuth } from '../context/AuthContext'
import { formatTime, markConversationRead, sendMessage, startSession } from '../lib/chatStore'
import { setActiveConversation } from '../lib/notificationAlerts'
import { useConversation, useSession, useTyping, useTypingBroadcast } from '../lib/useChatData'
import './chatPage.css'

export default function ChatPage() {
  const { currentUser } = useAuth()
  const conversationId = currentUser?.id ?? ''
  const messages = useConversation(conversationId)
  const session = useSession(conversationId)
  const { staffTyping, staffName } = useTyping(conversationId)
  const { ping: pingTyping, stop: stopTyping } = useTypingBroadcast(conversationId, currentUser)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, staffTyping])

  // Viewing the thread clears its notifications, including any reply that
  // lands while this page is open.
  const lastMessageAt = messages[messages.length - 1]?.createdAt
  useEffect(() => {
    if (!currentUser || !lastMessageAt) return
    markConversationRead(currentUser.id, conversationId)
  }, [currentUser, conversationId, lastMessageAt])

  // Tell the alerter which thread is on screen so it stays quiet for it.
  useEffect(() => {
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId])

  if (!currentUser) return null

  const ended = session?.status === 'ended'
  const paused = session?.status === 'paused'
  const locked = ended || paused

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || locked || !currentUser) return
    sendMessage(conversationId, currentUser, draft)
    setDraft('')
    stopTyping()
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setDraft(value)
    if (value.trim()) pingTyping()
    else stopTyping()
  }

  return (
    <div className="chat-page">
      <header className="chat-page-header">
        <div className="wrap chat-page-header-inner">
          <Link to="/" className="chat-page-back">
            <svg width="20" height="20"><use href="/icons.svg#chevron-icon" /></svg>
          </Link>
          <Logo />
        </div>
      </header>

      <main className="chat-thread-wrap">
        <div className="chat-thread-card">
          <div className="chat-thread-title">
            <span className="chat-thread-avatar">
              <svg width="20" height="20"><use href="/icons.svg#chat-icon" /></svg>
            </span>
            <div>
              <h1>Aalone Support</h1>
              <p>We usually reply within a few minutes.</p>
            </div>
          </div>

          <ChatTimer conversationId={conversationId} />

          <div className="chat-thread-messages">
            {messages.length === 0 && (
              <p className="chat-thread-empty">
                Say hello — a member of our care team will respond here.
              </p>
            )}
            {messages.map((m) => {

              const isMine = m.senderRole === 'user'
              return (
                <div key={m.id} className={`chat-bubble-row ${isMine ? 'is-mine' : 'is-support'}`}>
                  <div className="chat-bubble">
                    {!isMine && <span className="chat-bubble-sender">{m.senderName}</span>}
                    <p>{m.text}</p>
                    <span className="chat-bubble-time">{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              )
            })}
            {staffTyping && <TypingIndicator name={staffName || 'Aalone Support'} />}
            <div ref={endRef} />
          </div>

          {ended ? (
            <div className="chat-thread-closed">
              <p>This chat has ended and its time was billed.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => startSession(conversationId, currentUser)}
              >
                Start a new session
              </button>
            </div>
          ) : (
            <form className="chat-thread-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder={paused ? 'Chat paused — resume to continue' : 'Type your message…'}
                value={draft}
                onChange={handleDraftChange}
                onBlur={stopTyping}
                disabled={paused}
              />
              <button type="submit" className="btn btn-primary" disabled={!draft.trim() || locked}>
                <svg width="16" height="16"><use href="/icons.svg#send-icon" /></svg>
                Send
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
