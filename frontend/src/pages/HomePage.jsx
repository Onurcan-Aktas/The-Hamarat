import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { recipesAPI } from '../api/axios'
import RecipeCard from '../components/RecipeCard'

const CATEGORIES = [
  'All','Breakfast','Lunch','Dinner','Dessert','Snack',
  'Soup','Salad','Beverage','Appetizer','Bread','Seafood','Vegetarian','Vegan',
]

const HERO_BG = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85'

export default function HomePage() {
  const [recipes,    setRecipes]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [category,   setCategory]   = useState('All')
  const [search,     setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error,      setError]      = useState('')

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 12 }
      if (category !== 'All') params.category = category
      if (search) params.search = search
      const { data } = await recipesAPI.getAll(params)
      setRecipes(data.recipes)
      setTotalPages(data.pages)
    } catch {
      setError('Failed to load recipes. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [category, search, page])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleCategoryChange = (cat) => {
    setCategory(cat)
    setPage(1)
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-[480px] md:h-[560px] overflow-hidden">
        <img src={HERO_BG} alt="Delicious food" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-bark/60 via-bark/40 to-cream" />
        <div className="relative page-container h-full flex flex-col justify-center items-center text-center gap-6 pb-10">
          <div className="animate-fade-up" style={{ animationFillMode: 'both' }}>
            <p className="text-cream/80 text-sm font-mono tracking-widest uppercase mb-3">Welcome to</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream drop-shadow-lg leading-none">
              Hamarat
            </h1>
            <p className="mt-4 text-cream/85 text-lg md:text-xl font-body max-w-lg text-balance">
              Cook smarter with an AI sous-chef that knows every recipe by heart.
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-lg animate-fade-up"
            style={{ animationDelay: '150ms', animationFillMode: 'both' }}
          >
            <div className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-xl p-1.5 shadow-warm-lg border border-white/60">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search recipes…"
                className="flex-1 bg-transparent px-3 py-2 text-bark placeholder:text-bark-muted text-sm font-body outline-none"
              />
              <button type="submit" className="btn-primary text-sm py-2 px-5 rounded-lg">
                Search
              </button>
            </div>
          </form>

          <div
            className="flex items-center gap-4 text-cream/70 text-sm font-body animate-fade-up"
            style={{ animationDelay: '250ms', animationFillMode: 'both' }}
          >
            <Link to="/register" className="hover:text-cream transition-colors underline underline-offset-2">
              Join the community →
            </Link>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="page-container pb-20 -mt-6">
        {/* Category filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-smoke shadow-card p-2 mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-200 whitespace-nowrap ${
                  category === cat
                    ? 'bg-clay text-cream shadow-sm'
                    : 'text-bark-muted hover:text-bark hover:bg-smoke/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {search && (
              <p className="text-sm text-bark-muted mb-1">
                Results for{' '}
                <span className="font-medium text-bark">"{search}"</span>
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
                  className="ml-2 text-clay hover:underline"
                >
                  ✕ Clear
                </button>
              </p>
            )}
            <h2 className="section-title">
              {category === 'All' ? 'All Recipes' : category}
            </h2>
          </div>
          <Link to="/create" className="btn-primary text-sm hidden sm:inline-flex">
            + Share Recipe
          </Link>
        </div>

        {/* Grid */}
        {error ? (
          <div className="text-center py-20">
            <p className="text-clay font-medium">{error}</p>
            <button onClick={fetchRecipes} className="btn-secondary text-sm mt-3">Retry</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-bark mb-2">No recipes found</p>
            <p className="text-bark-muted text-sm">Try a different category or search term.</p>
            <Link to="/create" className="btn-primary text-sm mt-4 inline-flex">
              Be the first to share!
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.map((recipe, i) => (
                <RecipeCard key={recipe._id} recipe={recipe} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-bark-muted px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
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
