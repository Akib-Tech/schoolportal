import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getConversation, getPeople, listConversations, sendMessage } from '../lib/chatStore'
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
  const activePerson = people.find((p) => p.id === activeId)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (currentUser.role !== 'rep' && currentUser.role !== 'superadmin') {
    return <Navigate to="/chat" replace />
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activeId) return
    sendMessage(activeId, currentUser, draft)
    setDraft('')
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
        {activePerson ? (
          <>
            <header>
              <h1>{activePerson.name}</h1>
              <p>{activePerson.email}</p>
            </header>

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

            <form className="rep-inbox-input" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Reply as Aalone Support…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
                <svg width="16" height="16"><use href="/icons.svg#send-icon" /></svg>
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="rep-inbox-empty">Select a conversation to reply.</p>
        )}
      </section>
    </div>
  )
}
