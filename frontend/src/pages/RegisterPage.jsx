import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/axios'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await authAPI.register(form)
      setAuth(
        { _id: data._id, username: data.username, email: data.email, favorites: data.favorites || [] },
        data.token
      )
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-30 flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
    style={{ backgroundImage: "url('/registerbg.webp')" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>

      <div className="w-full max-w-md animate-fade-up" style={{ animationFillMode: 'both' }}>
        <div className="bg-white rounded-3xl border border-smoke shadow-warm-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-clay via-gold to-clay-light" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-clay rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-warm">
                <span className="font-display text-cream text-2xl font-bold">H</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-bark">Join Hamarat</h1>
              <p className="text-bark-muted text-sm mt-2">Create your free kitchen account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="Write your username"
                  minLength={3}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-clay/10 border border-clay/20 text-clay text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-dots"><span/><span/><span/></span>
                    Creating account…
                  </span>
                ) : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-bark-muted mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-clay font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
