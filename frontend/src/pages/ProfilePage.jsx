import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { recipesAPI, authAPI } from '../api/axios'
import useAuthStore from '../store/authStore'
import RecipeCard from '../components/RecipeCard'

export default function ProfilePage() {
  const { id }                      = useParams()
  const navigate                    = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuthStore()

  const [profileUser, setProfileUser] = useState(null)
  const [recipes,     setRecipes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  const isOwnProfile = currentUser?._id === id

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        // Fetch profile user info (use /auth/me only for own profile, else derive from recipes)
        if (isOwnProfile && isAuthenticated) {
          const { data: me } = await authAPI.getMe()
          setProfileUser(me)
        }

        const { data: userRecipes } = await recipesAPI.getByUser(id)
        setRecipes(userRecipes)

        // If not own profile, extract username from recipe authorId
        if (!isOwnProfile && userRecipes.length > 0) {
          setProfileUser({ username: userRecipes[0].authorId?.username, _id: id })
        } else if (!isOwnProfile && userRecipes.length === 0) {
          setProfileUser({ username: 'Chef', _id: id })
        }
      } catch {
        setError('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, isOwnProfile, isAuthenticated])

  const stats = {
    recipes: recipes.length,
    likes:   recipes.reduce((sum, r) => sum + (r.likes?.length || 0), 0),
    categories: [...new Set(recipes.map((r) => r.category))].length,
  }

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <p className="font-display text-2xl text-bark">{error}</p>
      <Link to="/" className="btn-secondary text-sm">← Home</Link>
    </div>
  )

  return (
    <div className="pt-16 min-h-screen">
      {/* Profile header banner */}
      <div className="relative bg-bark overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-clay/20" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-gold/15" />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-cream/5" />

        <div className="relative page-container py-14 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-clay flex items-center justify-center shadow-warm-lg border-4 border-white/10 flex-shrink-0">
              <span className="font-display text-3xl font-bold text-cream">
                {profileUser?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-cream">
                {profileUser?.username || 'Chef'}
              </h1>
              {profileUser?.email && isOwnProfile && (
                <p className="text-cream/50 text-sm mt-1 font-body">{profileUser.email}</p>
              )}
              {profileUser?.bio && (
                <p className="text-cream/70 text-sm mt-2 max-w-md">{profileUser.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-10">
              <StatBlock label="Recipes"    value={stats.recipes}    />
              <StatBlock label="Total Likes" value={stats.likes}     />
              <StatBlock label="Categories" value={stats.categories} />
            </div>
          </div>
        </div>
      </div>

      {/* Recipes section */}
      <div className="page-container py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">
            {isOwnProfile ? 'My Recipes' : `${profileUser?.username}'s Recipes`}
          </h2>
          {isOwnProfile && (
            <Link to="/create" className="btn-primary text-sm">
              + New Recipe
            </Link>
          )}
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-smoke shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-smoke mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-bark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="font-display text-xl text-bark mb-2">
              {isOwnProfile ? 'Your kitchen is empty' : 'No recipes yet'}
            </p>
            <p className="text-bark-muted text-sm">
              {isOwnProfile
                ? 'Share your first recipe and let Hamarat AI guide others through it.'
                : "This chef hasn't shared any recipes yet."}
            </p>
            {isOwnProfile && (
              <Link to="/create" className="btn-primary text-sm mt-5 inline-flex">
                Share your first recipe
              </Link>
            )}
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

function StatBlock({ label, value }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold text-cream">{value}</p>
      <p className="text-cream/50 text-xs font-body mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  )
}
