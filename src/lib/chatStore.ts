export type Role = 'user' | 'rep' | 'superadmin'

export interface Person {
  id: string
  name: string
  email: string
  role: Role
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderRole: Role
  senderName: string
  text: string
  createdAt: number
}

export interface ConversationSummary {
  userId: string
  lastMessage?: Message
}

const PEOPLE_KEY = 'aalone_people'
const MESSAGES_KEY = 'aalone_messages'
const SESSION_KEY = 'aalone_current_user'

export const STORE_UPDATE_EVENT = 'aalone-store-update'

const SEED_PEOPLE: Person[] = [
  { id: 'p-admin', name: 'Ada Okafor', email: 'ada.okafor@aalone.app', role: 'superadmin' },
  { id: 'p-user-1', name: 'Tunde Bakare', email: 'tunde.bakare@example.com', role: 'user' },
  { id: 'p-user-2', name: 'Ngozi Eze', email: 'ngozi.eze@example.com', role: 'user' },
]

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT))
}

export function ensureSeeded() {
  if (!localStorage.getItem(PEOPLE_KEY)) {
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(SEED_PEOPLE))
  }
  if (!localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, 'p-user-1')
  }
}

export function getPeople(): Person[] {
  return readJSON(PEOPLE_KEY, SEED_PEOPLE)
}

export function setRole(personId: string, role: Role) {
  const people = getPeople().map((p) => (p.id === personId ? { ...p, role } : p))
  writeJSON(PEOPLE_KEY, people)
}

export function addPerson(name: string, email: string, role: Role = 'user'): Person {
  const person: Person = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    email,
    role,
  }
  writeJSON(PEOPLE_KEY, [...getPeople(), person])
  return person
}

export function getCurrentUserId(): string {
  return localStorage.getItem(SESSION_KEY) ?? 'p-user-1'
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(SESSION_KEY, id)
  window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT))
}

export function getMessages(): Message[] {
  return readJSON(MESSAGES_KEY, [])
}

export function getConversation(conversationId: string): Message[] {
  return getMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function sendMessage(conversationId: string, sender: Person, text: string) {
  const trimmed = text.trim()
  if (!trimmed) return
  const message: Message = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    senderId: sender.id,
    senderRole: sender.role,
    senderName: sender.name,
    text: trimmed,
    createdAt: Date.now(),
  }
  writeJSON(MESSAGES_KEY, [...getMessages(), message])
}

export function listConversations(): ConversationSummary[] {
  const people = getPeople()
  const messages = getMessages()
  const byUser = new Map<string, Message[]>()
  for (const m of messages) {
    const list = byUser.get(m.conversationId) ?? []
    list.push(m)
    byUser.set(m.conversationId, list)
  }
  return people
    .filter((p) => p.role === 'user' || byUser.has(p.id))
    .map((p) => {
      const list = (byUser.get(p.id) ?? []).sort((a, b) => a.createdAt - b.createdAt)
      return { userId: p.id, lastMessage: list[list.length - 1] }
    })
    .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0))
}
