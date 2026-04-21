const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');

// @desc    Get all recipes (with optional category filter)
// @route   GET /api/recipes
const getRecipes = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Recipe.countDocuments(query);

    const recipes = await Recipe.find(query)
      .populate('authorId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      recipes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single recipe by ID
// @route   GET /api/recipes/:id
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      'authorId',
      'username email'
    );

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create recipe
// @route   POST /api/recipes
const createRecipe = async (req, res) => {
  try {
    const {
      title,
      category,
      ingredients,
      steps,
      servings,
      imageUrl,
      cookTime,
      prepTime,
      difficulty,
    } = req.body;

    if (!title || !category || !ingredients?.length || !steps?.length || !servings) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const recipe = await Recipe.create({
      title,
      authorId: req.user._id,
      category,
      ingredients,
      steps,
      servings,
      imageUrl,
      cookTime,
      prepTime,
      difficulty,
    });

    const populated = await recipe.populate('authorId', 'username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update recipe
// @route   PUT /api/recipes/:id
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (recipe.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('authorId', 'username');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (recipe.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ recipeId: req.params.id });

    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recipes by user
// @route   GET /api/recipes/user/:userId
const getRecipesByUser = async (req, res) => {
  try {
    const recipes = await Recipe.find({ authorId: req.params.userId })
      .populate('authorId', 'username')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like on recipe
// @route   POST /api/recipes/:id/like
const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const userId = req.user._id.toString();
    const likeIndex = recipe.likes.findIndex((id) => id.toString() === userId);

    if (likeIndex > -1) {
      recipe.likes.splice(likeIndex, 1);
    } else {
      recipe.likes.push(req.user._id);
    }

    await recipe.save();
    res.json({ likes: recipe.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByUser,
  toggleLike,
};
