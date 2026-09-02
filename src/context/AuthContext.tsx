import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ensureSeeded,
  getPeople,
  getCurrentUserId,
  login as loginStore,
  logout as logoutStore,
  signup as signupStore,
  STORE_UPDATE_EVENT,
  type AuthResult,
  type Person,
} from '../lib/chatStore'

interface AuthContextValue {
  currentUser: Person | null
  login: (email: string, password: string) => AuthResult
  signup: (name: string, email: string, password: string) => AuthResult
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

ensureSeeded()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>(() => getPeople())
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => getCurrentUserId())

  useEffect(() => {
    const refresh = () => {
      setPeople(getPeople())
      setCurrentUserId(getCurrentUserId())
    }
    window.addEventListener(STORE_UPDATE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORE_UPDATE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const currentUser = people.find((p) => p.id === currentUserId) ?? null

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login: loginStore,
        signup: signupStore,
        logout: logoutStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
