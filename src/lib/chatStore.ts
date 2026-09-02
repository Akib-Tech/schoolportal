import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db } from './firebase'

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

/** Support desk billing rate. Charges aren't collected yet — this drives the estimate only. */
export const SUPPORT_RATE_PER_MINUTE = 0.5
export const SUPPORT_CURRENCY = 'USD'

const peopleCol = collection(db, 'people')
const messagesCol = collection(db, 'messages')
const sessionsCol = collection(db, 'sessions')
const invitesCol = collection(db, 'invites')

function personFromDoc(id: string, data: Record<string, unknown>): Person {
  return {
    id,
    name: (data.name as string) ?? '',
    email: (data.email as string) ?? '',
    role: (data.role as Role) ?? 'user',
  }
}

/* ------------------------------------------------------------------ auth */

export interface AuthResult {
  ok: boolean
  error?: string
}

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match an account.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export function onAuthChange(cb: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb)
}

export async function fetchPerson(uid: string): Promise<Person | null> {
  const snap = await getDoc(doc(peopleCol, uid))
  return snap.exists() ? personFromDoc(snap.id, snap.data()) : null
}

export function subscribePerson(uid: string, cb: (person: Person | null) => void): Unsubscribe {
  return onSnapshot(doc(peopleCol, uid), (snap) => {
    cb(snap.exists() ? personFromDoc(snap.id, snap.data()) : null)
  })
}

/**
 * Creates the Firestore profile doc for an Auth user that doesn't have one
 * yet — covers accounts orphaned by a signup that created the Auth user but
 * failed partway through the Firestore write (e.g. a rules misconfiguration
 * at the time). Applies any pending role invite, same as a normal signup.
 */
export async function provisionPerson(uid: string, email: string, name: string): Promise<Person> {
  const normalized = email.trim().toLowerCase()
  const inviteSnap = await getDoc(doc(invitesCol, normalized))
  const role: Role = inviteSnap.exists() ? ((inviteSnap.data().role as Role) ?? 'user') : 'user'
  if (inviteSnap.exists()) await deleteDoc(doc(invitesCol, normalized))

  const person = { name, email: normalized, role }
  await setDoc(doc(peopleCol, uid), person)
  return { id: uid, ...person }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: authErrorMessage(err) }
  }
}

export async function signup(name: string, email: string, password: string): Promise<AuthResult> {
  const trimmedName = name.trim()
  const normalized = email.trim().toLowerCase()
  if (trimmedName.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }

  try {
    const credential = await createUserWithEmailAndPassword(auth, normalized, password)
    await provisionPerson(credential.user.uid, normalized, trimmedName)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: authErrorMessage(err) }
  }
}

export async function logout() {
  await signOut(auth)
}

/* ------------------------------------------------------------------ people */

export function subscribePeople(cb: (people: Person[]) => void): Unsubscribe {
  return onSnapshot(peopleCol, (snap) => {
    cb(snap.docs.map((d) => personFromDoc(d.id, d.data())))
  })
}

export async function setRole(personId: string, role: Role) {
  await updateDoc(doc(peopleCol, personId), { role })
}

/**
 * Pre-assigns a role for an email that hasn't signed up yet. When that email
 * creates an account, the role is applied automatically. If the person has
 * already signed up, their role is updated immediately instead.
 */
export async function invitePerson(email: string, role: Role = 'user') {
  const normalized = email.trim().toLowerCase()
  const existing = await getDocByEmail(normalized)
  if (existing) {
    await setRole(existing.id, role)
    return
  }
  await setDoc(doc(invitesCol, normalized), { role, createdAt: Date.now() })
}

async function getDocByEmail(normalized: string): Promise<Person | null> {
  const snap = await getDocs(query(peopleCol, where('email', '==', normalized)))
  const found = snap.docs[0]
  return found ? personFromDoc(found.id, found.data()) : null
}

/* -------------------------------------------------------------- messages */

function messageFromDoc(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    conversationId: data.conversationId as string,
    senderId: data.senderId as string,
    senderRole: data.senderRole as Role,
    senderName: data.senderName as string,
    text: data.text as string,
    createdAt: data.createdAt as number,
  }
}

export function subscribeConversation(
  conversationId: string,
  cb: (messages: Message[]) => void,
): Unsubscribe {
  const q = query(
    messagesCol,
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => messageFromDoc(d.id, d.data())))
  })
}

export function subscribeAllMessages(cb: (messages: Message[]) => void): Unsubscribe {
  return onSnapshot(messagesCol, (snap) => {
    cb(snap.docs.map((d) => messageFromDoc(d.id, d.data())))
  })
}

export async function sendMessage(conversationId: string, sender: Person, text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  const session = await fetchSession(conversationId)
  if (session && session.status !== 'active') return

  await addDoc(messagesCol, {
    conversationId,
    senderId: sender.id,
    senderRole: sender.role,
    senderName: sender.name,
    text: trimmed,
    createdAt: Date.now(),
  })
  if (!session) await startSession(conversationId, sender)
}

export function deriveConversations(people: Person[], messages: Message[]): ConversationSummary[] {
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

function sessionFromDoc(id: string, data: Record<string, unknown>): ChatSession {
  return {
    conversationId: id,
    status: data.status as SessionStatus,
    runStartedAt: (data.runStartedAt as number | null) ?? null,
    accumulatedMs: (data.accumulatedMs as number) ?? 0,
    ratePerMinute: (data.ratePerMinute as number) ?? SUPPORT_RATE_PER_MINUTE,
    createdAt: data.createdAt as number,
    updatedAt: data.updatedAt as number,
    events: (data.events as SessionEvent[]) ?? [],
  }
}

export function subscribeSession(
  conversationId: string,
  cb: (session: ChatSession | null) => void,
): Unsubscribe {
  return onSnapshot(doc(sessionsCol, conversationId), (snap) => {
    cb(snap.exists() ? sessionFromDoc(snap.id, snap.data()) : null)
  })
}

export async function fetchSession(conversationId: string): Promise<ChatSession | null> {
  const snap = await getDoc(doc(sessionsCol, conversationId))
  return snap.exists() ? sessionFromDoc(snap.id, snap.data()) : null
}

export async function startSession(conversationId: string, by: Person) {
  const existing = await fetchSession(conversationId)
  if (existing && existing.status !== 'ended') return existing

  const now = Date.now()
  const session = {
    status: 'active' as SessionStatus,
    runStartedAt: now,
    accumulatedMs: 0,
    ratePerMinute: SUPPORT_RATE_PER_MINUTE,
    createdAt: now,
    updatedAt: now,
    events: [{ action: 'start', at: now, byId: by.id, byName: by.name }],
  }
  await setDoc(doc(sessionsCol, conversationId), session)
  return { conversationId, ...session }
}

export async function pauseSession(conversationId: string, by: Person) {
  const s = await fetchSession(conversationId)
  if (!s || s.status !== 'active') return
  const now = Date.now()
  await updateDoc(doc(sessionsCol, conversationId), {
    accumulatedMs: sessionElapsedMs(s, now),
    status: 'paused',
    runStartedAt: null,
    updatedAt: now,
    events: arrayUnion({ action: 'pause', at: now, byId: by.id, byName: by.name }),
  })
}

export async function resumeSession(conversationId: string, by: Person) {
  const s = await fetchSession(conversationId)
  if (!s || s.status !== 'paused') return
  const now = Date.now()
  await updateDoc(doc(sessionsCol, conversationId), {
    status: 'active',
    runStartedAt: now,
    updatedAt: now,
    events: arrayUnion({ action: 'resume', at: now, byId: by.id, byName: by.name }),
  })
}

export async function stopSession(conversationId: string, by: Person) {
  const s = await fetchSession(conversationId)
  if (!s || s.status === 'ended') return
  const now = Date.now()
  await updateDoc(doc(sessionsCol, conversationId), {
    accumulatedMs: sessionElapsedMs(s, now),
    status: 'ended',
    runStartedAt: null,
    updatedAt: now,
    events: arrayUnion({ action: 'stop', at: now, byId: by.id, byName: by.name }),
  })
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

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: SUPPORT_CURRENCY,
  }).format(amount)
}
