import { useEffect, useState } from 'react'
import {
  deriveConversations,
  subscribeAllMessages,
  subscribeConversation,
  subscribePeople,
  subscribeSession,
  type ChatSession,
  type ConversationSummary,
  type Message,
  type Person,
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
