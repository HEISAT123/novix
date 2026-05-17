import { post } from '../lib/apiClient'

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: string
  username: string
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  console.log('[authApi] register() вызов с данными:', { username: data.username, email: data.email })
  const response = await post<AuthResponse>('/auth/register', data)
  console.log('[authApi] register() ответ:', response)
  localStorage.setItem('token', response.access_token)
  localStorage.setItem('user_id', response.user_id)
  localStorage.setItem('username', response.username)
  return response
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  console.log('[authApi] login() вызов с email:', data.email)
  const response = await post<AuthResponse>('/auth/login', data)
  console.log('[authApi] login() ответ:', response)
  localStorage.setItem('token', response.access_token)
  localStorage.setItem('user_id', response.user_id)
  localStorage.setItem('username', response.username)
  return response
}

export function logout(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('username')
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem('user_id')
}

export function getCurrentUsername(): string | null {
  return localStorage.getItem('username')
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}
