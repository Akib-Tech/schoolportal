import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { getConversation, sendMessage } from '../lib/chatStore'
import { useLiveStore } from '../lib/useLiveStore'
import './chatPage.css'

export default function ChatPage() {
  const { currentUser } = useAuth()
  const conversationId = currentUser.id
  const messages = useLiveStore(() => getConversation(conversationId), [conversationId])
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(conversationId, currentUser, draft)
    setDraft('')
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
                    {!isMine && <span className="chat-bubble-sender">Aalone Support</span>}
                    <p>{m.text}</p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          <form className="chat-thread-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
              <svg width="16" height="16"><use href="/icons.svg#send-icon" /></svg>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
