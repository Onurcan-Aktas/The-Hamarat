import { useState } from 'react'

const CATEGORIES = [
  'Breakfast','Lunch','Dinner','Dessert','Snack',
  'Soup','Salad','Beverage','Appetizer','Bread','Seafood','Vegetarian','Vegan','Other',
]
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const UNITS = ['g','kg','ml','l','tsp','tbsp','cup','oz','lb','piece','slice','clove','pinch','handful','bunch','to taste']

const emptyIngredient = () => ({ name: '', quantity: '', unit: 'g' })
const emptyStep = () => ''

export default function RecipeForm({ initialData = {}, onSubmit, loading }) {
  const [title,      setTitle]      = useState(initialData.title      || '')
  const [category,   setCategory]   = useState(initialData.category   || '')
  const [servings,   setServings]   = useState(initialData.servings   || 4)
  const [prepTime,   setPrepTime]   = useState(initialData.prepTime   || 15)
  const [cookTime,   setCookTime]   = useState(initialData.cookTime   || 30)
  const [difficulty, setDifficulty] = useState(initialData.difficulty || 'Medium')
  const [imageUrl,   setImageUrl]   = useState(initialData.imageUrl   || '')
  const [ingredients, setIngredients] = useState(
    initialData.ingredients?.length ? initialData.ingredients : [emptyIngredient()]
  )
  const [steps, setSteps] = useState(
    initialData.steps?.length ? initialData.steps : [emptyStep()]
  )
  const [errors, setErrors] = useState({})

  // ── Ingredient helpers ────────────────────────────────────────────────────
  const addIngredient = () => setIngredients([...ingredients, emptyIngredient()])
  const removeIngredient = (i) => setIngredients(ingredients.filter((_, idx) => idx !== i))
  const updateIngredient = (i, field, value) => {
    const updated = [...ingredients]
    updated[i] = { ...updated[i], [field]: value }
    setIngredients(updated)
  }

  // ── Step helpers ──────────────────────────────────────────────────────────
  const addStep = () => setSteps([...steps, emptyStep()])
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i, value) => {
    const updated = [...steps]
    updated[i] = value
    setSteps(updated)
  }
  const moveStep = (i, dir) => {
    const updated = [...steps]
    const target = i + dir
    if (target < 0 || target >= updated.length) return
    ;[updated[i], updated[target]] = [updated[target], updated[i]]
    setSteps(updated)
  }

  // ── Validation & submit ───────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!title.trim())    e.title    = 'Title is required'
    if (!category)        e.category = 'Category is required'
    if (servings < 1)     e.servings = 'Must be at least 1'
    if (ingredients.some((ing) => !ing.name.trim() || !ing.quantity || !ing.unit))
      e.ingredients = 'All ingredient fields are required'
    if (steps.some((s) => !s.trim()))
      e.steps = 'All steps must have content'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    setErrors({})
    onSubmit({
      title: title.trim(),
      category,
      servings: Number(servings),
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      difficulty,
      imageUrl: imageUrl.trim(),
      ingredients: ingredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: Number(ing.quantity),
        unit: ing.unit,
      })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Basic info ── */}
      <section className="bg-white rounded-2xl border border-smoke shadow-card p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-bark border-b border-smoke pb-3">
          Basic Information
        </h2>

        <div>
          <label className="block text-sm font-medium text-bark mb-1.5">Recipe Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grandma's Lamb Stew"
            maxLength={120}
            className="input-field"
          />
          {errors.title && <p className="text-clay text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field bg-white">
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-clay text-xs mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field bg-white">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Servings *</label>
            <input type="number" min={1} max={100} value={servings} onChange={(e) => setServings(e.target.value)} className="input-field" />
            {errors.servings && <p className="text-clay text-xs mt-1">{errors.servings}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Prep (min)</label>
            <input type="number" min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Cook (min)</label>
            <input type="number" min={0} value={cookTime} onChange={(e) => setCookTime(e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bark mb-1.5">Image URL <span className="text-bark-muted font-normal">(optional)</span></label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="input-field"
          />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-40 object-cover rounded-lg border border-smoke" onError={(e) => e.target.style.display='none'} />
          )}
        </div>
      </section>

      {/* ── Ingredients ── */}
      <section className="bg-white rounded-2xl border border-smoke shadow-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold text-bark border-b border-smoke pb-3">
          Ingredients
        </h2>
        {errors.ingredients && (
          <p className="text-clay text-xs bg-clay/10 px-3 py-2 rounded-lg border border-clay/20">{errors.ingredients}</p>
        )}

        <div className="space-y-3">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start animate-fade-up" style={{ animationFillMode: 'both' }}>
              {/* Row number */}
              <span className="w-7 h-10 flex items-center justify-center text-xs font-mono text-bark-muted flex-shrink-0">
                {i + 1}.
              </span>

              {/* Quantity */}
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                className="input-field w-20 flex-shrink-0 text-sm"
              />

              {/* Unit */}
              <select
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                className="input-field w-28 flex-shrink-0 bg-white text-sm"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>

              {/* Name */}
              <input
                type="text"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                className="input-field flex-1 text-sm"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={ingredients.length === 1}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-smoke-dark text-bark-muted hover:text-clay hover:border-clay/40 transition-colors disabled:opacity-30 flex-shrink-0"
                title="Remove"
              >
                <MinusIcon />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addIngredient} className="btn-secondary text-sm gap-1.5">
          <PlusIcon /> Add Ingredient
        </button>
      </section>

      {/* ── Steps ── */}
      <section className="bg-white rounded-2xl border border-smoke shadow-card p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold text-bark border-b border-smoke pb-3">
          Instructions
        </h2>
        {errors.steps && (
          <p className="text-clay text-xs bg-clay/10 px-3 py-2 rounded-lg border border-clay/20">{errors.steps}</p>
        )}

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start animate-fade-up" style={{ animationFillMode: 'both' }}>
              {/* Step badge */}
              <div className="w-8 h-8 rounded-full bg-clay/15 border border-clay/25 flex items-center justify-center flex-shrink-0 mt-2.5">
                <span className="text-clay text-xs font-semibold font-mono">{i + 1}</span>
              </div>

              {/* Text area */}
              <textarea
                rows={2}
                placeholder={`Describe step ${i + 1}…`}
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                className="input-field flex-1 resize-none text-sm leading-relaxed"
              />

              {/* Move + remove controls */}
              <div className="flex flex-col gap-1 flex-shrink-0 mt-1.5">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0}
                  className="h-7 w-7 flex items-center justify-center rounded border border-smoke-dark text-bark-muted hover:text-bark disabled:opacity-20 transition-colors text-xs">
                  ↑
                </button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                  className="h-7 w-7 flex items-center justify-center rounded border border-smoke-dark text-bark-muted hover:text-bark disabled:opacity-20 transition-colors text-xs">
                  ↓
                </button>
                <button type="button" onClick={() => removeStep(i)} disabled={steps.length === 1}
                  className="h-7 w-7 flex items-center justify-center rounded border border-smoke-dark text-bark-muted hover:text-clay disabled:opacity-20 transition-colors">
                  <MinusIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addStep} className="btn-secondary text-sm gap-1.5">
          <PlusIcon /> Add Step
        </button>
      </section>

      {/* ── Submit ── */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 py-3 text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="loading-dots"><span/><span/><span/></span>
              Saving…
            </span>
          ) : 'Save Recipe'}
        </button>
      </div>
    </form>
  )
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const MinusIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
