import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  deriveConversations,
  deriveNotifications,
  setTyping,
  subscribeAllMessages,
  subscribeConversation,
  subscribePeople,
  subscribeReadState,
  subscribeSession,
  subscribeTyping,
  TYPING_STALE_MS,
  type ChatNotification,
  type ChatSession,
  type ConversationSummary,
  type Message,
  type Person,
  type ReadState,
  type TypingState,
} from './chatStore'

export function usePeople(): Person[] {
  const [people, setPeople] = useState<Person[]>([])
  useEffect(() => subscribePeople(setPeople), [])
  return people
}

export function useConversation(conversationId: string): Message[] {
  const [messages, setMessages] = useState<Message[]>([])
  const [loadedFor, setLoadedFor] = useState(conversationId)
  if (conversationId !== loadedFor) {
    setLoadedFor(conversationId)
    setMessages([])
  }

  useEffect(() => {
    if (!conversationId) return
    return subscribeConversation(conversationId, setMessages)
  }, [conversationId])
  return messages
}

export function useSession(conversationId: string): ChatSession | null {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [loadedFor, setLoadedFor] = useState(conversationId)
  if (conversationId !== loadedFor) {
    setLoadedFor(conversationId)
    setSession(null)
  }

  useEffect(() => {
    if (!conversationId) return
    return subscribeSession(conversationId, setSession)
  }, [conversationId])
  return session
}

export function useConversations(): ConversationSummary[] {
  const people = usePeople()
  const [messages, setMessages] = useState<Message[]>([])
  useEffect(() => subscribeAllMessages(setMessages), [])
  return deriveConversations(people, messages)
}

/**
 * Unread-thread notifications for the signed-in viewer, plus a running total
 * of unread messages across them. Staff watch every thread; a member watches
 * only their own.
 */
export function useNotifications(): { items: ChatNotification[]; total: number } {
  const { currentUser } = useAuth()
  const people = usePeople()
  const [messages, setMessages] = useState<Message[]>([])
  const [seen, setSeen] = useState<ReadState>({})

  const uid = currentUser?.id ?? null
  const isStaff = currentUser?.role === 'rep' || currentUser?.role === 'superadmin'

  // Reset cached data when the signed-in viewer changes (e.g. logout).
  const [loadedFor, setLoadedFor] = useState(uid)
  if (uid !== loadedFor) {
    setLoadedFor(uid)
    setMessages([])
    setSeen({})
  }

  useEffect(() => {
    if (!uid) return
    return isStaff ? subscribeAllMessages(setMessages) : subscribeConversation(uid, setMessages)
  }, [uid, isStaff])

  useEffect(() => {
    if (!uid) return
    return subscribeReadState(uid, setSeen)
  }, [uid])

  if (!currentUser) return { items: [], total: 0 }

  const items = deriveNotifications(currentUser, people, messages, seen)
  return { items, total: items.reduce((sum, it) => sum + it.unreadCount, 0) }
}

const NO_TYPING: TypingState = { userAt: null, staffAt: null, staffName: null }

/**
 * Live "is typing" state for a conversation. Returns booleans (not raw
 * timestamps) and self-expires: a heartbeat older than TYPING_STALE_MS reads
 * as not-typing even if no fresh snapshot has arrived.
 */
export function useTyping(conversationId: string): {
  userTyping: boolean
  staffTyping: boolean
  staffName: string | null
} {
  const [raw, setRaw] = useState<TypingState>(NO_TYPING)
  const [now, setNow] = useState(() => Date.now())

  const [loadedFor, setLoadedFor] = useState(conversationId)
  if (conversationId !== loadedFor) {
    setLoadedFor(conversationId)
    setRaw(NO_TYPING)
  }

  useEffect(() => {
    if (!conversationId) return
    return subscribeTyping(conversationId, setRaw)
  }, [conversationId])

  // While a heartbeat is present, advance `now` on a timer so freshness is
  // re-evaluated and the indicator clears even when the writer simply stopped
  // sending heartbeats (e.g. their tab closed).
  const hasSignal = raw.userAt !== null || raw.staffAt !== null
  useEffect(() => {
    if (!hasSignal) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [hasSignal])

  const fresh = (t: number | null) => t !== null && now - t < TYPING_STALE_MS
  return {
    userTyping: fresh(raw.userAt),
    staffTyping: fresh(raw.staffAt),
    staffName: raw.staffName,
  }
}

/**
 * Broadcasts the signed-in viewer's typing state for a conversation. Call
 * `ping()` on every keystroke — writes are throttled to one per ~2.5s and a
 * stop is sent automatically ~3.5s after the last keystroke, on `stop()`, and
 * on unmount / conversation change.
 */
export function useTypingBroadcast(conversationId: string, actor: Person | null) {
  const lastPing = useRef(0)
  const active = useRef(false)
  const stopTimer = useRef<number | null>(null)

  const canBroadcast = Boolean(conversationId) && actor !== null

  const stop = useCallback(() => {
    if (stopTimer.current !== null) {
      window.clearTimeout(stopTimer.current)
      stopTimer.current = null
    }
    if (active.current && canBroadcast && actor) {
      active.current = false
      setTyping(conversationId, actor, false).catch(() => {})
    }
  }, [conversationId, actor, canBroadcast])

  const ping = useCallback(() => {
    if (!canBroadcast || !actor) return
    const now = Date.now()
    if (!active.current || now - lastPing.current > 2500) {
      lastPing.current = now
      active.current = true
      setTyping(conversationId, actor, true).catch(() => {})
    }
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current)
    stopTimer.current = window.setTimeout(stop, 3500)
  }, [conversationId, actor, canBroadcast, stop])

  // Clear on unmount or whenever the conversation / actor changes (`stop`'s
  // identity tracks both).
  useEffect(() => stop, [stop])

  return { ping, stop }
}
