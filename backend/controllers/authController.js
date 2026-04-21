const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: 'Email or username already in use' });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [],
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      favorites: user.favorites || [],
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc    Get current user's favorite recipes (populated)
// @route   GET /api/auth/favorites
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: { path: 'authorId', select: 'username' },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter out any favorites that reference deleted recipes
    const favorites = (user.favorites || []).filter(Boolean);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle favorite status on a recipe
// @route   POST /api/auth/favorites/:recipeId
const toggleFavorite = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idx = user.favorites.findIndex(
      (id) => id.toString() === recipeId.toString()
    );

    let favorited;
    if (idx > -1) {
      user.favorites.splice(idx, 1);
      favorited = false;
    } else {
      user.favorites.push(recipeId);
      favorited = true;
    }

    await user.save();

    res.json({
      favorited,
      favorites: user.favorites.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a recipe from favorites
// @route   DELETE /api/auth/favorites/:recipeId
const removeFavorite = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.favorites = user.favorites.filter(
      (id) => id.toString() !== recipeId.toString()
    );
    await user.save();

    res.json({
      favorited: false,
      favorites: user.favorites.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getFavorites,
  toggleFavorite,
  removeFavorite,
};
