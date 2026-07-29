'use client'

import { create } from 'zustand'
import type { User } from '@/types'
import { setToken, setRefreshToken, removeToken, removeRefreshToken, isAuthenticated } from '@/lib/auth'
import * as api from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (_email: string, _password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (_email: string, _password: string) => {
    const res = await api.login(_email, _password)
    setToken(res.access_token)
    setRefreshToken(res.refresh_token)
    set({
      user: { id: res.user_id, email: _email } as User,
      isAuthenticated: true,
      isLoading: false,
    })
  },
  logout: () => {
    removeToken()
    removeRefreshToken()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
  checkAuth: async () => {
    if (!isAuthenticated()) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }
    try {
      const user = await api.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      removeToken()
      removeRefreshToken()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
