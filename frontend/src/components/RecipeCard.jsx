import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'

const CATEGORY_COLORS = {
  Breakfast: 'bg-gold/15 text-gold-dark border-gold/25',
  Lunch:     'bg-sage/15 text-sage-dark border-sage/25',
  Dinner:    'bg-clay/10 text-clay border-clay/20',
  Dessert:   'bg-pink-50 text-pink-600 border-pink-100',
  Snack:     'bg-amber-50 text-amber-700 border-amber-100',
  Soup:      'bg-orange-50 text-orange-600 border-orange-100',
  Salad:     'bg-green-50 text-green-700 border-green-100',
  Beverage:  'bg-blue-50 text-blue-600 border-blue-100',
  default:   'bg-smoke text-bark-muted border-smoke-dark',
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
  'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
]

export default function RecipeCard({ recipe, index = 0 }) {
  const categoryColor =
    CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.default

  const image =
    recipe.imageUrl ||
    PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]

  const totalTime = (recipe.prepTime || 15) + (recipe.cookTime || 30)

  return (
    <Link
      to={`/recipes/${recipe._id}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${(index % 6) * 60}ms`, animationFillMode: 'both' }}
    >
      <article className="card h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[4/3] bg-smoke">
          <img
            src={image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.target.src = PLACEHOLDER_IMAGES[0] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bark/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category badge */}
          <span className={`absolute top-3 left-3 tag border text-[11px] font-medium ${categoryColor}`}>
            {recipe.category}
          </span>

          {/* Difficulty */}
          <span className="absolute top-3 right-3 tag border text-[11px]">
            {recipe.difficulty || 'Medium'}
          </span>

          {/* Favorite toggle */}
          <div className="absolute bottom-3 right-3">
            <FavoriteButton recipeId={recipe._id} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-display text-lg font-semibold text-bark leading-snug line-clamp-2 group-hover:text-clay transition-colors">
            {recipe.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-bark-muted font-body mt-auto pt-2 border-t border-smoke">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {totalTime} min
            </span>
            <span className="flex items-center gap-1">
              <ServingsIcon />
              {recipe.servings} servings
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <HeartIcon />
              {recipe.likes?.length || 0}
            </span>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 pt-1">
            <div className="w-6 h-6 rounded-full bg-clay/15 flex items-center justify-center flex-shrink-0">
              <span className="text-clay text-xs font-semibold font-display">
                {recipe.authorId?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-xs text-bark-muted truncate">
              by {recipe.authorId?.username || 'Unknown'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const ServingsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const HeartIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
