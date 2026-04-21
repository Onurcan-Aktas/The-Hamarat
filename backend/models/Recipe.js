const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true, trim: true },
});

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Breakfast',
        'Lunch',
        'Dinner',
        'Dessert',
        'Snack',
        'Soup',
        'Salad',
        'Beverage',
        'Appetizer',
        'Bread',
        'Seafood',
        'Vegetarian',
        'Vegan',
        'Other',
      ],
    },
    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one ingredient is required',
      },
    },
    steps: {
      type: [String],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one step is required',
      },
    },
    servings: {
      type: Number,
      required: [true, 'Servings is required'],
      min: [1, 'Servings must be at least 1'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    cookTime: {
      type: Number, // minutes
      default: 30,
    },
    prepTime: {
      type: Number, // minutes
      default: 15,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

recipeSchema.index({ title: 'text', category: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
