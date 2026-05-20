import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ApiUser } from '../types'
import { getToken, setToken } from '../api/client'
import * as authApi from '../api/auth'
import type { LoginInput, RegisterInput } from '../api/auth'

interface AuthContextValue {
  user: ApiUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: ApiUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAuth = useCallback((token: string, apiUser: ApiUser) => {
    setToken(token)
    setUserState(apiUser)
  }, [])

  const refreshUser = useCallback(async () => {
    const { user: me } = await authApi.fetchMe()
    setUserState(me)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .fetchMe()
      .then(({ user: me }) => setUserState(me))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const { token, user: apiUser } = await authApi.login(input)
      applyAuth(token, apiUser)
    },
    [applyAuth],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const { token, user: apiUser } = await authApi.register(input)
      applyAuth(token, apiUser)
    },
    [applyAuth],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUserState(null)
  }, [])

  const setUser = useCallback((u: ApiUser) => {
    setUserState(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, logout, refreshUser, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
