const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');

// @desc    Get comments for a recipe
// @route   GET /api/comments/:recipeId
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ recipeId: req.params.recipeId })
      .populate('authorId', 'username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment
// @route   POST /api/comments/:recipeId
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = await Comment.create({
      text: text.trim(),
      authorId: req.user._id,
      recipeId: req.params.recipeId,
    });

    const populated = await comment.populate('authorId', 'username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getComments, addComment, deleteComment };
