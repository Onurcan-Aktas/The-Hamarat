import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { recipesAPI } from '../api/axios'
import useAuthStore from '../store/authStore'
import RecipeForm from '../components/RecipeForm'

export default function EditRecipePage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [recipe,   setRecipe]  = useState(null)
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [error,    setError]   = useState('')

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data } = await recipesAPI.getById(id)
        // Ownership guard
        if (data.authorId?._id !== user?._id && data.authorId !== user?._id) {
          navigate('/', { replace: true })
          return
        }
        setRecipe(data)
      } catch {
        setError('Recipe not found.')
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [id, user, navigate])

  const handleSubmit = async (formData) => {
    setSaving(true)
    setError('')
    try {
      await recipesAPI.update(id, formData)
      navigate(`/recipes/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update recipe.')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  )

  if (error && !recipe) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <p className="font-display text-2xl text-bark">{error}</p>
      <Link to="/" className="btn-secondary text-sm">← Back</Link>
    </div>
  )

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="page-container max-w-3xl">
        <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'both' }}>
          <Link
            to={`/recipes/${id}`}
            className="text-sm text-bark-muted hover:text-bark transition-colors flex items-center gap-1 mb-4"
          >
            ← Back to recipe
          </Link>
          <h1 className="font-display text-4xl font-bold text-bark">Edit Recipe</h1>
          <p className="text-bark-muted mt-2">Update your recipe details below.</p>
        </div>

        {error && (
          <div className="mb-6 bg-clay/10 border border-clay/20 text-clay text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          {recipe && (
            <RecipeForm
              initialData={recipe}
              onSubmit={handleSubmit}
              loading={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
}
