import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  getMe:     ()     => api.get('/auth/me'),
}

// ── Favorites ────────────────────────────────────────────────────────────────
export const favoritesAPI = {
  getAll:       ()    => api.get('/auth/favorites'),
  toggle:       (rid) => api.post(`/auth/favorites/${rid}`),
  remove:       (rid) => api.delete(`/auth/favorites/${rid}`),
}

// ── Recipes ──────────────────────────────────────────────────────────────────
export const recipesAPI = {
  getAll:        (params) => api.get('/recipes', { params }),
  getById:       (id)     => api.get(`/recipes/${id}`),
  getByUser:     (uid)    => api.get(`/recipes/user/${uid}`),
  create:        (data)   => api.post('/recipes', data),
  update:        (id, d)  => api.put(`/recipes/${id}`, d),
  delete:        (id)     => api.delete(`/recipes/${id}`),
  toggleLike:    (id)     => api.post(`/recipes/${id}/like`),
}

// ── Comments ─────────────────────────────────────────────────────────────────
export const commentsAPI = {
  getByRecipe: (rid)       => api.get(`/comments/${rid}`),
  add:         (rid, data) => api.post(`/comments/${rid}`, data),
  delete:      (id)        => api.delete(`/comments/${id}`),
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getSession:   (rid)       => api.get(`/chat/${rid}`),
  sendMessage:  (rid, data) => api.post(`/chat/${rid}`, data),
  clearSession: (rid)       => api.delete(`/chat/${rid}`),
}

export default api
