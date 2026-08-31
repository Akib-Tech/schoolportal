import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ensureSeeded,
  getPeople,
  getCurrentUserId,
  setCurrentUserId,
  STORE_UPDATE_EVENT,
  type Person,
} from '../lib/chatStore'

interface AuthContextValue {
  currentUser: Person
  people: Person[]
  switchUser: (id: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

ensureSeeded()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [people, setPeopleState] = useState<Person[]>(() => getPeople())
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => getCurrentUserId())

  useEffect(() => {
    const refresh = () => {
      setPeopleState(getPeople())
      setCurrentUserIdState(getCurrentUserId())
    }
    window.addEventListener(STORE_UPDATE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const currentUser = people.find((p) => p.id === currentUserId) ?? people[0]

  return (
    <AuthContext.Provider value={{ currentUser, people, switchUser: setCurrentUserId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
