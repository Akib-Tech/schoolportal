import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  deriveConversations,
  deriveNotifications,
  subscribeAllMessages,
  subscribeConversation,
  subscribePeople,
  subscribeReadState,
  subscribeSession,
  type ChatNotification,
  type ChatSession,
  type ConversationSummary,
  type Message,
  type Person,
  type ReadState,
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
