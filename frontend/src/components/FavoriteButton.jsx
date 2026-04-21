import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { favoritesAPI } from '../api/axios'
import useAuthStore from '../store/authStore'

/**
 * FavoriteButton — interactive heart toggle.
 *
 * Variants:
 *   - "icon"  : floating icon-only button (used on recipe cards)
 *   - "pill"  : icon + count pill button (used on the detail page)
 */
export default function FavoriteButton({
  recipeId,
  variant = 'icon',
  onToggle,
  stopPropagation = true,
  className = '',
}) {
  const navigate = useNavigate()
  const { isAuthenticated, favorites, setFavorites } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const active = favorites.includes(String(recipeId))

  const handleClick = async (e) => {
    if (stopPropagation) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (loading) return

    // Optimistic update
    const prev = favorites
    const next = active
      ? prev.filter((id) => id !== String(recipeId))
      : [...prev, String(recipeId)]
    setFavorites(next)
    setLoading(true)

    try {
      const { data } = await favoritesAPI.toggle(recipeId)
      setFavorites(data.favorites)
      onToggle?.(data.favorited)
    } catch {
      // Roll back on error
      setFavorites(prev)
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={active}
        aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
          active
            ? 'bg-clay/10 text-clay border-clay/25'
            : 'border-smoke-dark text-bark-muted hover:text-clay hover:border-clay/25'
        } ${loading ? 'opacity-70' : ''} ${className}`}
      >
        <HeartIcon filled={active} />
        <span>{active ? 'Saved' : 'Save'}</span>
      </button>
    )
  }

  // Icon variant (default) — suitable for recipe cards
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      title={active ? 'Remove from favorites' : 'Save to favorites'}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm border transition-all duration-200 ${
        active
          ? 'bg-clay text-cream border-clay shadow-sm'
          : 'bg-white/85 text-bark-muted border-white/70 hover:text-clay hover:bg-white'
      } ${loading ? 'opacity-70' : 'hover:scale-105 active:scale-95'} ${className}`}
    >
      <HeartIcon filled={active} />
    </button>
  )
}

const HeartIcon = ({ filled }) => (
  <svg
    className="w-4 h-4"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
)
