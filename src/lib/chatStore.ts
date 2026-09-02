export type Role = 'user' | 'rep' | 'superadmin'

export interface Person {
  id: string
  name: string
  email: string
  role: Role
  /** Prototype-only: plaintext password kept in localStorage. Not for production. */
  password: string
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

export type SessionStatus = 'active' | 'paused' | 'ended'

export interface SessionEvent {
  action: 'start' | 'pause' | 'resume' | 'stop'
  at: number
  byId: string
  byName: string
}

export interface ChatSession {
  conversationId: string
  status: SessionStatus
  /** When the current running stretch began. null while paused or ended. */
  runStartedAt: number | null
  /** Sealed billable time from previous running stretches, in ms. */
  accumulatedMs: number
  ratePerMinute: number
  createdAt: number
  updatedAt: number
  events: SessionEvent[]
}

const PEOPLE_KEY = 'aalone_people_v2'
const MESSAGES_KEY = 'aalone_messages'
const SESSION_KEY = 'aalone_current_user_v2'
const SESSIONS_KEY = 'aalone_chat_sessions'

export const STORE_UPDATE_EVENT = 'aalone-store-update'

/** Support desk billing rate. Charges aren't collected yet — this drives the estimate only. */
export const SUPPORT_RATE_PER_MINUTE = 0.5
export const SUPPORT_CURRENCY = 'USD'

const SEED_PEOPLE: Person[] = [
  { id: 'p-admin', name: 'Ada Okafor', email: 'ada.okafor@aalone.app', role: 'superadmin', password: 'admin1234' },
  { id: 'p-rep', name: 'Chidi Nwosu', email: 'chidi.nwosu@aalone.app', role: 'rep', password: 'care1234' },
  { id: 'p-user-1', name: 'Tunde Bakare', email: 'tunde.bakare@example.com', role: 'user', password: 'demo1234' },
  { id: 'p-user-2', name: 'Ngozi Eze', email: 'ngozi.eze@example.com', role: 'user', password: 'demo1234' },
]

/** Accounts shown in the "demo logins" helper on the sign-in screen. */
export const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'ada.okafor@aalone.app', password: 'admin1234' },
  { label: 'Care Rep', email: 'chidi.nwosu@aalone.app', password: 'care1234' },
  { label: 'User', email: 'tunde.bakare@example.com', password: 'demo1234' },
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
    password: 'demo1234',
  }
  writeJSON(PEOPLE_KEY, [...getPeople(), person])
  return person
}

/* ------------------------------------------------------------------ auth */

export function getCurrentUserId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export interface AuthResult {
  ok: boolean
  error?: string
}

export function login(email: string, password: string): AuthResult {
  const normalized = email.trim().toLowerCase()
  const person = getPeople().find((p) => p.email.toLowerCase() === normalized)
  if (!person || person.password !== password) {
    return { ok: false, error: 'That email and password don’t match an account.' }
  }
  localStorage.setItem(SESSION_KEY, person.id)
  window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT))
  return { ok: true }
}

export function signup(name: string, email: string, password: string): AuthResult {
  const trimmedName = name.trim()
  const normalized = email.trim().toLowerCase()
  if (trimmedName.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  if (getPeople().some((p) => p.email.toLowerCase() === normalized)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  const person: Person = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    email: email.trim(),
    role: 'user',
    password,
  }
  writeJSON(PEOPLE_KEY, [...getPeople(), person])
  localStorage.setItem(SESSION_KEY, person.id)
  window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT))
  return { ok: true }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT))
}

/* -------------------------------------------------------------- messages */

export function getMessages(): Message[] {
  return readJSON(MESSAGES_KEY, [])
}

export function getConversation(conversationId: string): Message[] {
  return getMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function sendMessage(conversationId: string, sender: Person, text: string): Message | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const session = getSession(conversationId)
  if (session && session.status !== 'active') return null

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
  if (!session) startSession(conversationId, sender)
  return message
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

/* --------------------------------------------------- chat timer sessions */

function getSessions(): Record<string, ChatSession> {
  return readJSON<Record<string, ChatSession>>(SESSIONS_KEY, {})
}

function writeSessions(map: Record<string, ChatSession>) {
  writeJSON(SESSIONS_KEY, map)
}

export function getSession(conversationId: string): ChatSession | null {
  return getSessions()[conversationId] ?? null
}

export function startSession(conversationId: string, by: Person): ChatSession {
  const map = getSessions()
  const existing = map[conversationId]
  if (existing && existing.status !== 'ended') return existing

  const now = Date.now()
  const session: ChatSession = {
    conversationId,
    status: 'active',
    runStartedAt: now,
    accumulatedMs: 0,
    ratePerMinute: SUPPORT_RATE_PER_MINUTE,
    createdAt: now,
    updatedAt: now,
    events: [{ action: 'start', at: now, byId: by.id, byName: by.name }],
  }
  map[conversationId] = session
  writeSessions(map)
  return session
}

export function pauseSession(conversationId: string, by: Person) {
  const map = getSessions()
  const s = map[conversationId]
  if (!s || s.status !== 'active') return
  const now = Date.now()
  s.accumulatedMs = sessionElapsedMs(s, now)
  s.status = 'paused'
  s.runStartedAt = null
  s.updatedAt = now
  s.events.push({ action: 'pause', at: now, byId: by.id, byName: by.name })
  writeSessions(map)
}

export function resumeSession(conversationId: string, by: Person) {
  const map = getSessions()
  const s = map[conversationId]
  if (!s || s.status !== 'paused') return
  const now = Date.now()
  s.status = 'active'
  s.runStartedAt = now
  s.updatedAt = now
  s.events.push({ action: 'resume', at: now, byId: by.id, byName: by.name })
  writeSessions(map)
}

export function stopSession(conversationId: string, by: Person) {
  const map = getSessions()
  const s = map[conversationId]
  if (!s || s.status === 'ended') return
  const now = Date.now()
  s.accumulatedMs = sessionElapsedMs(s, now)
  s.status = 'ended'
  s.runStartedAt = null
  s.updatedAt = now
  s.events.push({ action: 'stop', at: now, byId: by.id, byName: by.name })
  writeSessions(map)
}

/** Total elapsed billable time in ms, including the current running stretch. */
export function sessionElapsedMs(s: ChatSession, now: number = Date.now()): number {
  const running = s.status === 'active' && s.runStartedAt ? Math.max(0, now - s.runStartedAt) : 0
  return s.accumulatedMs + running
}

/** Billable minutes — any partial minute rounds up to a full minute. */
export function billableMinutes(ms: number): number {
  return Math.ceil(ms / 60000)
}

export function sessionCharge(s: ChatSession, now: number = Date.now()): number {
  return billableMinutes(sessionElapsedMs(s, now)) * s.ratePerMinute
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: SUPPORT_CURRENCY,
  }).format(amount)
}
