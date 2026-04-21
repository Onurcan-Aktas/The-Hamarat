import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { recipesAPI } from '../api/axios'
import useAuthStore from '../store/authStore'
import CommentSection from '../components/CommentSection'
import HamaratChat from '../components/HamaratChat'
import FavoriteButton from '../components/FavoriteButton'

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&q=85',
]

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [recipe,      setRecipe]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [liked,       setLiked]       = useState(false)
  const [likeCount,   setLikeCount]   = useState(0)
  const [chatOpen,    setChatOpen]    = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true)
      try {
        const { data } = await recipesAPI.getById(id)
        setRecipe(data)
        setLikeCount(data.likes?.length || 0)
        setLiked(data.likes?.includes(user?._id))
      } catch {
        setError('Recipe not found or server error.')
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [id])

  const handleLike = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    try {
      const { data } = await recipesAPI.toggleLike(id)
      setLikeCount(data.likes)
      setLiked(data.liked)
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm('Delete this recipe permanently?')) return
    setDeleting(true)
    try {
      await recipesAPI.delete(id)
      navigate(`/profile/${user._id}`)
    } catch {
      alert('Could not delete recipe.')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  )

  if (error || !recipe) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <p className="font-display text-2xl text-bark">{error || 'Recipe not found'}</p>
      <Link to="/" className="btn-secondary text-sm">← Back to recipes</Link>
    </div>
  )

  const image   = recipe.imageUrl || PLACEHOLDER_IMAGES[0]
  const isOwner = user?._id === recipe.authorId?._id
  const total   = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-smoke">
        <img
          src={image}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER_IMAGES[0] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/20 to-transparent" />

        {/* Overlay title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 page-container">
          <span className="tag-category mb-3 inline-block">{recipe.category}</span>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-cream drop-shadow leading-tight max-w-3xl">
            {recipe.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <Link to={`/profile/${recipe.authorId?._id}`} className="text-cream/80 text-sm hover:text-cream transition-colors font-body">
              by {recipe.authorId?.username}
            </Link>
          </div>
        </div>
      </div>

      {/* Content area with optional chat panel */}
      <div className={`relative transition-all duration-300 ${chatOpen ? 'mr-0 md:mr-[400px]' : ''}`}>
        <div className="page-container py-10">
          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white rounded-2xl border border-smoke shadow-card">
            <MetaBadge icon={<ClockIcon />} label="Prep" value={`${recipe.prepTime || 0} min`} />
            <div className="w-px h-8 bg-smoke-dark" />
            <MetaBadge icon={<FlameIcon />} label="Cook" value={`${recipe.cookTime || 0} min`} />
            <div className="w-px h-8 bg-smoke-dark" />
            <MetaBadge icon={<ClockIcon />} label="Total" value={`${total} min`} />
            <div className="w-px h-8 bg-smoke-dark" />
            <MetaBadge icon={<ServingsIcon />} label="Serves" value={recipe.servings} />
            <div className="w-px h-8 bg-smoke-dark" />
            <MetaBadge icon={<StarIcon />} label="Difficulty" value={recipe.difficulty || 'Medium'} />

            {/* Action buttons */}
            <div className="ml-auto flex items-center gap-2">
              <FavoriteButton
                recipeId={recipe._id}
                variant="pill"
                stopPropagation={false}
              />
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  liked
                    ? 'bg-clay/10 text-clay border-clay/25'
                    : 'border-smoke-dark text-bark-muted hover:text-clay hover:border-clay/25'
                }`}
              >
                <HeartIcon filled={liked} />
                {likeCount}
              </button>

              {isOwner && (
                <>
                  <Link to={`/edit/${recipe._id}`} className="btn-secondary text-xs py-2 px-3">Edit</Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn-secondary text-xs py-2 px-3 text-clay border-clay/25 hover:bg-clay/5"
                  >
                    {deleting ? '…' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Two-column: ingredients + steps */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            {/* Ingredients */}
            <aside className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-smoke shadow-card p-6 lg:sticky lg:top-24">
                <h2 className="font-display text-xl font-semibold text-bark mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-clay/15 flex items-center justify-center">
                    <ListIcon />
                  </span>
                  Ingredients
                  <span className="ml-auto text-sm font-body font-normal text-bark-muted">
                    {recipe.servings} servings
                  </span>
                </h2>
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 border-b border-smoke last:border-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-clay flex-shrink-0" />
                      <span className="text-sm font-medium text-bark">{ing.name}</span>
                      <span className="ml-auto text-sm text-bark-muted font-mono whitespace-nowrap">
                        {ing.quantity} {ing.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Steps */}
            <div className="lg:col-span-3">
              <h2 className="font-display text-xl font-semibold text-bark mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-clay/15 flex items-center justify-center">
                  <StepsIcon />
                </span>
                Instructions
              </h2>
              <ol className="space-y-5">
                {recipe.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-4 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clay text-cream flex items-center justify-center text-sm font-semibold font-mono shadow-sm mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border border-smoke shadow-sm leading-relaxed text-bark text-sm">
                      {step}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Hamarat CTA */}
          <div className="my-8 p-6 md:p-8 bg-bark rounded-2xl text-cream relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-cream" />
              <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-clay" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-cream">
                  Ready to cook? 🍳
                </h3>
                <p className="text-cream/70 text-sm mt-1 max-w-sm">
                  Open Hamarat AI — your personal sous-chef who knows this recipe by heart, tracks your steps, and answers every question.
                </p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="flex-shrink-0 flex items-center gap-2.5 bg-clay hover:bg-clay-dark text-cream font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-clay/30 hover:-translate-y-0.5"
              >
                <ChefHatIcon />
                Prepare with Hamarat
              </button>
            </div>
          </div>

          {/* Comments */}
          <CommentSection recipeId={id} />
        </div>
      </div>

      {/* Hamarat Chat Panel (slide-in sidebar) */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-cream shadow-warm-lg border-l border-smoke z-50 flex flex-col transition-transform duration-300 ease-out ${
          chatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {chatOpen && (
          <HamaratChat
            recipeId={id}
            recipeTitle={recipe.title}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {/* Overlay for mobile */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-bark/40 z-40 md:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}

function MetaBadge({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-clay">{icon}</span>
      <div>
        <p className="text-xs text-bark-muted leading-none">{label}</p>
        <p className="font-medium text-bark mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const FlameIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
  </svg>
)
const ServingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const ListIcon = () => (
  <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const StepsIcon = () => (
  <svg className="w-3.5 h-3.5 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
)
const HeartIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const ChefHatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0A4 4 0 0118 13.87V21H6v-7.13z"/>
    <line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
)
