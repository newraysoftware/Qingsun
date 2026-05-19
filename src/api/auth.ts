import { apiRequest } from './client'
import type { ApiUser } from '../types'

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  yearsOfPractice?: number
}

export interface LoginInput {
  email: string
  password: string
}

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchMe() {
  return apiRequest<{ user: ApiUser }>('/api/auth/me')
}

export function updateProfile(patch: Partial<ApiUser>) {
  return apiRequest<{ user: ApiUser }>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}
