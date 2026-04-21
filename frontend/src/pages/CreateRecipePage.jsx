import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { recipesAPI } from '../api/axios'
import RecipeForm from '../components/RecipeForm'

export default function CreateRecipePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await recipesAPI.create(formData)
      navigate(`/recipes/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create recipe. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="page-container max-w-3xl">
        {/* Header */}
        <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'both' }}>
          <Link to="/" className="text-sm text-bark-muted hover:text-bark transition-colors flex items-center gap-1 mb-4">
            ← Back to recipes
          </Link>
          <h1 className="font-display text-4xl font-bold text-bark">Share a Recipe</h1>
          <p className="text-bark-muted mt-2">
            Fill in the details below. The more precise your ingredients and steps, the better your Hamarat AI assistant will be able to guide others through cooking it.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-clay/10 border border-clay/20 text-clay text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <RecipeForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}
