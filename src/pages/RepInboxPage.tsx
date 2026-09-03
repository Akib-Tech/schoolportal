import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import ChatTimer from '../components/ChatTimer'
import TypingIndicator from '../components/TypingIndicator'
import { useAuth } from '../context/AuthContext'
import { formatTime, markConversationRead, sendMessage, startSession } from '../lib/chatStore'
import { setActiveConversation } from '../lib/notificationAlerts'
import {
  useConversation,
  useConversations,
  usePeople,
  useSession,
  useTyping,
  useTypingBroadcast,
} from '../lib/useChatData'
import './repInbox.css'

export default function RepInboxPage() {
  const { currentUser } = useAuth()
  const conversations = useConversations()
  const people = usePeople()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // On phones the list and thread share the screen one at a time. Desktop shows
  // both, so this flag is a no-op there (see repInbox.css).
  const deepLinkId = searchParams.get('c')
  const [showThread, setShowThread] = useState(() => Boolean(deepLinkId))
  const [ackedDeepLink, setAckedDeepLink] = useState(deepLinkId)
  // A notification (first load or while already here) should reveal the thread.
  if (deepLinkId && deepLinkId !== ackedDeepLink) {
    setAckedDeepLink(deepLinkId)
    setShowThread(true)
  }

  // `?c=<id>` deep link from a notification wins until the rep picks another thread.
  const activeId = selectedId ?? deepLinkId ?? conversations[0]?.userId ?? null

  function openConversation(id: string) {
    setSelectedId(id)
    setShowThread(true)
  }

  function backToList() {
    setShowThread(false)
    if (deepLinkId) {
      setAckedDeepLink(null)
      setSearchParams({}, { replace: true })
    }
  }

  const messages = useConversation(activeId ?? '')
  const session = useSession(activeId ?? '')
  const { userTyping } = useTyping(activeId ?? '')
  const { ping: pingTyping, stop: stopTyping } = useTypingBroadcast(activeId ?? '', currentUser)
  const activePerson = people.find((p) => p.id === activeId)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, userTyping])

  // Opening a thread clears its notifications for this staff member.
  const lastMessageAt = messages[messages.length - 1]?.createdAt
  useEffect(() => {
    if (!currentUser || !activeId || !lastMessageAt) return
    markConversationRead(currentUser.id, activeId)
  }, [currentUser, activeId, lastMessageAt])

  // Tell the alerter which thread is on screen so it stays quiet for it.
  useEffect(() => {
    setActiveConversation(activeId)
    return () => setActiveConversation(null)
  }, [activeId])

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
    sendMessage(activeId, currentUser, draft)
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
    <div className="rep-inbox" data-mobile-view={showThread ? 'thread' : 'list'}>
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
                  onClick={() => openConversation(c.userId)}
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
              <button
                type="button"
                className="rep-inbox-back"
                onClick={backToList}
                aria-label="Back to conversations"
              >
                <svg width="20" height="20"><use href="/icons.svg#chevron-icon" /></svg>
              </button>
              <div>
                <h1>{activePerson.name}</h1>
                <p>{activePerson.email}</p>
              </div>
            </header>

            <ChatTimer conversationId={activeId} />

            <div className="rep-inbox-messages">
              {messages.map((m) => {
                const isSupport = m.senderRole !== 'user'
                return (
                  <div key={m.id} className={`chat-bubble-row ${isSupport ? 'is-mine' : 'is-support'}`}>
                    <div className="chat-bubble">
                      {!isSupport && <span className="chat-bubble-sender">{m.senderName}</span>}
                      <p>{m.text}</p>
                      <span className="chat-bubble-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
              {userTyping && <TypingIndicator name={activePerson.name} />}
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
          </>
        ) : (
          <div className="rep-inbox-empty">
            <button
              type="button"
              className="rep-inbox-back"
              onClick={backToList}
              aria-label="Back to conversations"
            >
              <svg width="20" height="20"><use href="/icons.svg#chevron-icon" /></svg>
            </button>
            <p>Select a conversation to reply.</p>
          </div>
        )}
      </section>
    </div>
  )
}
