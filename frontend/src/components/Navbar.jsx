import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'


export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-card border-b border-smoke'
          : 'bg-transparent'
      }`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16 " >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg bg-white/60 backdrop-blur-md text-bark hover:bg-white/80 transition-all">
            <span className="w-10 h-10 shadow-sm rounded-lg flex items-center justify-center transition-all group-hover:brightness-95">
              <img 
                src="/favicon.jpg" 
                alt="Hamarat Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            </span>
            <span className="font-display text-xl font-bold text-black tracking-tight">
              Hamarat
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="text-sm font-medium px-4 py-2 rounded-full bg-white/60 backdrop-blur-md text-bark hover:bg-white/80 transition-all">Discover</Link>
            {isAuthenticated && (
              <>
                <Link to="/create" className="btn-ghost text-sm">+ New Recipe</Link>
                <Link to="/favorites" className="btn-ghost text-sm">Favorites</Link>
                <Link to={`/profile/${user._id}`} className="btn-ghost text-sm">
                  My Kitchen
                </Link>
              </>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-full bg-clay/15 border border-clay/25 flex items-center justify-center">
                    <span className="text-clay text-sm font-semibold font-display">
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-bark-muted group-hover:text-bark transition-colors font-body">
                    {user.username}
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg bg-white/60 backdrop-blur-md text-bark hover:bg-white/80 transition-all">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Join free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-smoke transition-colors"
            aria-label="Menu"
          >
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-bark transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-bark transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-bark transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-smoke animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link to="/" className="btn-ghost justify-start text-sm">Discover</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/create" className="btn-ghost justify-start text-sm">+ New Recipe</Link>
                  <Link to="/favorites" className="btn-ghost justify-start text-sm">Favorites</Link>
                  <Link to={`/profile/${user._id}`} className="btn-ghost justify-start text-sm">My Kitchen</Link>
                  <button onClick={handleLogout} className="btn-ghost justify-start text-sm text-clay">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost justify-start text-sm">Sign in</Link>
                  <Link to="/register" className="btn-primary text-sm mt-2">Join free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
