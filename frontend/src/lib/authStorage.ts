import type { User } from '../types/user'

const USERS_KEY = 'oprosi_users_v1'
const SESSION_KEY = 'oprosi_session_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Примечание: Хеширование на клиенте НЕ заменяет серверную аутентификацию.
 * Эта функция оставлена только для локальной разработки без бэкенда.
 * В production используйте только API вызовы к серверу.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function loadUsers(): User[] {
  return readJson<User[]>(USERS_KEY, [])
}

export function persistUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadSession(): string | null {
  return readJson<string | null>(SESSION_KEY, null)
}

export function persistSession(userId: string | null): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(userId))
}

export function getUserByEmail(email: string): User | undefined {
  const users = loadUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export async function registerUser(email: string, password: string, username: string): User {
  const users = loadUsers()
  
  if (getUserByEmail(email)) {
    throw new Error('Этот email уже зарегистрирован. Войдите в систему или восстановите пароль.')
  }
  
  const hashedPassword = await hashPassword(password)
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password: hashedPassword,
    username: username.trim(),
    createdAt: new Date().toISOString(),
  }
  
  users.push(user)
  persistUsers(users)
  return user
}

const LOGIN_ATTEMPTS_KEY = 'oprosi_login_attempts_v1'
const LOGIN_ATTEMPTS_TIMESTAMP_KEY = 'oprosi_login_attempts_timestamp_v1'
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

function getLoginAttempts(): number {
  return readJson<number>(LOGIN_ATTEMPTS_KEY, 0)
}

function setLoginAttempts(attempts: number): void {
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
}

function getLoginAttemptsTimestamp(): number {
  return readJson<number>(LOGIN_ATTEMPTS_TIMESTAMP_KEY, 0)
}

function setLoginAttemptsTimestamp(timestamp: number): void {
  localStorage.setItem(LOGIN_ATTEMPTS_TIMESTAMP_KEY, JSON.stringify(timestamp))
}

function isLoginBlocked(): boolean {
  const attempts = getLoginAttempts()
  const timestamp = getLoginAttemptsTimestamp()
  
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const elapsed = Date.now() - timestamp
    if (elapsed < LOGIN_COOLDOWN_MS) {
      return true
    }
    // Reset if cooldown has passed
    setLoginAttempts(0)
    setLoginAttemptsTimestamp(0)
  }
  
  return false
}

function recordFailedLogin(): void {
  const attempts = getLoginAttempts() + 1
  setLoginAttempts(attempts)
  if (attempts === 1) {
    setLoginAttemptsTimestamp(Date.now())
  }
}

function resetLoginAttempts(): void {
  setLoginAttempts(0)
  setLoginAttemptsTimestamp(0)
}

export async function loginUser(email: string, password: string): User {
  if (isLoginBlocked()) {
    throw new Error('Слишком много неудачных попыток. Попробуйте через 5 минут.')
  }
  
  const user = getUserByEmail(email)
  
  if (!user) {
    recordFailedLogin()
    throw new Error('Неверное имя пользователя или пароль. Войдите или зарегистрируйтесь.')
  }
  
  const hashedPassword = await hashPassword(password)
  if (user.password !== hashedPassword) {
    recordFailedLogin()
    throw new Error('Неверное имя пользователя или пароль. Войдите или зарегистрируйтесь.')
  }
  
  resetLoginAttempts()
  persistSession(user.id)
  return user
}

export function logoutUser(): void {
  persistSession(null)
}

export function getCurrentUser(): User | null {
  const userId = loadSession()
  if (!userId) return null
  
  const users = loadUsers()
  return users.find((u) => u.id === userId) ?? null
}
