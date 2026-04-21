import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { favoritesAPI } from '../api/axios'
import useAuthStore from '../store/authStore'
import RecipeCard from '../components/RecipeCard'

export default function FavoritesPage() {
  const { favorites, setFavorites } = useAuthStore()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await favoritesAPI.getAll()
      setRecipes(data)
      // Keep store in sync with server-truth
      setFavorites(data.map((r) => r._id))
    } catch {
      setError('Could not load your favorites. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setFavorites])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // When a recipe is unfavorited from this page, drop it from the visible list.
  useEffect(() => {
    setRecipes((prev) => prev.filter((r) => favorites.includes(String(r._id))))
  }, [favorites])

  return (
    <div className="pt-16 min-h-screen">
      {/* Header banner */}
      <div className="relative bg-bark overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-clay/20" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-gold/15" />

        <div className="relative page-container py-12 md:py-16">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-clay flex items-center justify-center shadow-warm-lg border-4 border-white/10 flex-shrink-0">
              <HeartIcon />
            </div>
            <div>
              <p className="text-cream/60 text-xs font-mono uppercase tracking-widest mb-1">
                Your collection
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-cream leading-none">
                My Favorites
              </h1>
              <p className="text-cream/70 text-sm mt-2 font-body">
                {recipes.length > 0
                  ? `${recipes.length} saved recipe${recipes.length === 1 ? '' : 's'} — ready to cook anytime.`
                  : 'Recipes you save will appear here.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-10">
        {error ? (
          <div className="text-center py-20">
            <p className="text-clay font-medium">{error}</p>
            <button onClick={fetchFavorites} className="btn-secondary text-sm mt-3">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-smoke shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-clay/10 mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-clay"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
            </div>
            <p className="font-display text-xl text-bark mb-2">No favorites yet</p>
            <p className="text-bark-muted text-sm max-w-sm mx-auto">
              Tap the heart on any recipe to save it here for easy access while
              you cook.
            </p>
            <Link to="/" className="btn-primary text-sm mt-5 inline-flex">
              Browse recipes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe, i) => (
              <RecipeCard key={recipe._id} recipe={recipe} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-smoke bg-white animate-pulse">
      <div className="aspect-[4/3] bg-smoke" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-smoke rounded w-3/4" />
        <div className="h-3 bg-smoke rounded w-1/2" />
        <div className="h-3 bg-smoke rounded w-full" />
      </div>
    </div>
  )
}

const HeartIcon = () => (
  <svg
    className="w-6 h-6 text-cream"
    fill="currentColor"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.6}
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
)
