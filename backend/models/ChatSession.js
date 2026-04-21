const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    messagesHistory: [messageSchema],
  },
  { timestamps: true }
);

// One session per user per recipe
chatSessionSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
