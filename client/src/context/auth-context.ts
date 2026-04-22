import { createContext } from 'react'
import type { User } from '../types/user'

export interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
