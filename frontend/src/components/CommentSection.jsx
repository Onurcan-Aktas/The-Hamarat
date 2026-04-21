import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { commentsAPI } from '../api/axios'
import useAuthStore from '../store/authStore'

export default function CommentSection({ recipeId }) {
  const { isAuthenticated, user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchComments()
  }, [recipeId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const { data } = await commentsAPI.getByRecipe(recipeId)
      setComments(data)
    } catch {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const { data } = await commentsAPI.add(recipeId, { text })
      setComments([data, ...comments])
      setText('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await commentsAPI.delete(commentId)
      setComments(comments.filter((c) => c._id !== commentId))
    } catch {
      alert('Could not delete comment')
    }
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold text-bark mb-6 flex items-center gap-2">
        <ChatBubbleIcon />
        Community Notes
        {comments.length > 0 && (
          <span className="ml-1 text-sm font-body font-normal text-bark-muted">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-clay/15 border border-clay/25 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-clay text-sm font-semibold font-display">
                {user.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share a tip, variation, or your experience making this recipe…"
                rows={3}
                maxLength={1000}
                className="input-field resize-none text-sm"
              />
              {error && <p className="text-sm text-clay mt-1">{error}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-bark-muted">{text.length}/1000</span>
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {submitting ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-smoke/50 rounded-xl border border-smoke-dark text-center">
          <p className="text-sm text-bark-muted">
            <Link to="/login" className="text-clay font-medium hover:underline">Sign in</Link>
            {' '}to leave a comment.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading-dots">
            <span/><span/><span/>
          </div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-bark-muted">
          <p className="font-display text-lg">No comments yet.</p>
          <p className="text-sm mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, i) => (
            <div
              key={comment._id}
              className="flex gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              <div className="w-8 h-8 rounded-full bg-smoke-dark border border-smoke-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-bark-muted text-xs font-semibold font-display">
                  {comment.authorId?.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-smoke shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-bark">
                    {comment.authorId?.username || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-bark-muted">{timeAgo(comment.createdAt)}</span>
                    {user?._id === comment.authorId?._id && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-xs text-bark-muted hover:text-clay transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-bark leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const ChatBubbleIcon = () => (
  <svg className="w-6 h-6 text-clay" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
)

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
