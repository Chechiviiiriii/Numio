import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface Profile {
  nombre: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
  profile: Profile | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  profile: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile })
}))
