import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      favorites: [], // array of recipe ids (strings)

      setAuth: (user, token) => {
        const favorites = (user?.favorites || []).map((id) => String(id))
        set({ user, token, isAuthenticated: true, favorites })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, favorites: [] })
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }))
      },

      setFavorites: (favorites) => {
        set({ favorites: (favorites || []).map((id) => String(id)) })
      },

      isFavorite: (recipeId) => {
        if (!recipeId) return false
        return get().favorites.includes(String(recipeId))
      },
    }),
    {
      name: 'hamarat-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        favorites: state.favorites,
      }),
    }
  )
)

export default useAuthStore
