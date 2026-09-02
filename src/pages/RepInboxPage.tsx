import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import ChatTimer from '../components/ChatTimer'
import { useAuth } from '../context/AuthContext'
import {
  getConversation,
  getPeople,
  getSession,
  listConversations,
  sendMessage,
  startSession,
} from '../lib/chatStore'
import { useLiveStore } from '../lib/useLiveStore'
import './repInbox.css'

export default function RepInboxPage() {
  const { currentUser } = useAuth()
  const conversations = useLiveStore(() => listConversations(), [])
  const people = useLiveStore(() => getPeople(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const activeId = selectedId ?? conversations[0]?.userId ?? null
  const messages = useLiveStore(
    () => (activeId ? getConversation(activeId) : []),
    [activeId],
  )
  const session = useLiveStore(() => (activeId ? getSession(activeId) : null), [activeId])
  const activePerson = people.find((p) => p.id === activeId)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'rep' && currentUser.role !== 'superadmin') {
    return <Navigate to="/chat" replace />
  }

  const ended = session?.status === 'ended'
  const paused = session?.status === 'paused'
  const locked = ended || paused

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activeId || locked || !currentUser) return
    const sent = sendMessage(activeId, currentUser, draft)
    if (sent) setDraft('')
  }

  return (
    <div className="rep-inbox">
      <aside className="rep-inbox-list">
        <h2>Conversations</h2>
        {conversations.length === 0 && <p className="rep-inbox-empty">No conversations yet.</p>}
        <ul>
          {conversations.map((c) => {
            const person = people.find((p) => p.id === c.userId)
            return (
              <li key={c.userId}>
                <button
                  type="button"
                  className={c.userId === activeId ? 'is-active' : ''}
                  onClick={() => setSelectedId(c.userId)}
                >
                  <span className="rep-inbox-name">{person?.name ?? 'Unknown user'}</span>
                  <span className="rep-inbox-preview">
                    {c.lastMessage ? c.lastMessage.text : 'No messages yet'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className="rep-inbox-thread">
        {activePerson && activeId ? (
          <>
            <header>
              <h1>{activePerson.name}</h1>
              <p>{activePerson.email}</p>
            </header>

            <ChatTimer conversationId={activeId} />

            <div className="rep-inbox-messages">
              {messages.map((m) => {
                const isSupport = m.senderRole !== 'user'
                return (
                  <div key={m.id} className={`chat-bubble-row ${isSupport ? 'is-mine' : 'is-support'}`}>
                    <div className="chat-bubble">
                      {isSupport && <span className="chat-bubble-sender">{m.senderName} (you)</span>}
                      <p>{m.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {ended ? (
              <div className="rep-inbox-closed">
                <span>This chat has ended and its time was billed.</span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => startSession(activeId, currentUser)}
                >
                  Start a new session
                </button>
              </div>
            ) : (
              <form className="rep-inbox-input" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder={paused ? 'Chat paused — resume to continue' : 'Reply as Aalone Support…'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={paused}
                />
                <button type="submit" className="btn btn-primary" disabled={!draft.trim() || locked}>
                  <svg width="16" height="16"><use href="/icons.svg#send-icon" /></svg>
                  Send
                </button>
              </form>
            )}
          </>
        ) : (
          <p className="rep-inbox-empty">Select a conversation to reply.</p>
        )}
      </section>
    </div>
  )
}
