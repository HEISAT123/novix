import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUserId, getCurrentUsername, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/authApi'
import type { User } from '../types/user'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(() => {
    const userId = getCurrentUserId()
    const username = getCurrentUsername()
    if (userId && username) {
      setUser({ id: userId, email: '', username })
    } else {
      setUser(null)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh()
    setIsLoading(false)
  }, [refresh])
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = async (email: string, password: string) => {
    const response = await apiLogin({ email, password })
    setUser({ id: response.user_id, email, username: response.username })
  }

  const register = async (email: string, password: string, username: string) => {
    const response = await apiRegister({ username, email, password })
    setUser({ id: response.user_id, email, username: response.username })
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

