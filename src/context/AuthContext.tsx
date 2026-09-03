import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  login as loginStore,
  logout as logoutStore,
  onAuthChange,
  provisionPerson,
  signInWithGoogle as signInWithGoogleStore,
  signup as signupStore,
  subscribePerson,
  type AuthResult,
  type Person,
} from '../lib/chatStore'

interface AuthContextValue {
  currentUser: Person | null
  authLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (name: string, email: string, password: string) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Person | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let unsubPerson: (() => void) | null = null

    const unsubAuth = onAuthChange((user) => {
      unsubPerson?.()
      unsubPerson = null

      if (!user) {
        setCurrentUser(null)
        setAuthLoading(false)
        return
      }

      // A new uid just signed in — hold RequireAuth off until their profile
      // doc has actually loaded, so it doesn't bounce them back to /login
      // while currentUser is still stale from before.
      setAuthLoading(true)
      let provisioning = false
      unsubPerson = subscribePerson(user.uid, (person) => {
        if (person) {
          setCurrentUser(person)
          setAuthLoading(false)
          return
        }
        // Auth account exists but its Firestore profile doesn't (e.g. an
        // earlier signup's Firestore write failed after the Auth account
        // was already created). Self-heal instead of bouncing forever.
        if (provisioning) return
        provisioning = true
        const fallbackName = user.displayName || user.email?.split('@')[0] || 'New member'
        provisionPerson(user.uid, user.email ?? '', fallbackName)
          .catch((err) => {
            console.error('Failed to provision profile for', user.uid, err)
            setCurrentUser(null)
            setAuthLoading(false)
          })
          .finally(() => {
            provisioning = false
          })
      })
    })

    return () => {
      unsubAuth()
      unsubPerson?.()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        login: loginStore,
        signup: signupStore,
        signInWithGoogle: signInWithGoogleStore,
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
