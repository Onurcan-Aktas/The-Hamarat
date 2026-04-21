const { GoogleGenerativeAI } = require('@google/generative-ai');
const Recipe = require('../models/Recipe');
const ChatSession = require('../models/ChatSession');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildSystemPrompt = (recipe) => {
  const ingredientsList = recipe.ingredients
    .map((i) => `- ${i.quantity} ${i.unit} of ${i.name}`)
    .join('\n');

  const stepsList = recipe.steps
    .map((s, idx) => `Step ${idx + 1}: ${s}`)
    .join('\n');

  return `You are Hamarat, a warm, expert, and encouraging sous-chef AI assistant. Your sole purpose is to help the user cook the recipe described below. You are knowledgeable, patient, and supportive.

// RECIPE CONTEXT:
====================
Recipe Name: ${recipe.title}
Category: ${recipe.category}
Servings: ${recipe.servings}
Prep Time: ${recipe.prepTime} minutes
Cook Time: ${recipe.cookTime} minutes
Difficulty: ${recipe.difficulty}

INGREDIENTS (for ${recipe.servings} servings):
${ingredientsList}

STEPS:
${stepsList}
====================

YOUR CORE CAPABILITIES:
1. **Step-by-step guidance**: Walk the user through each step in detail. Track which steps have been completed based on the conversation.
2. **Answer recipe questions**: Only answer questions related to this specific recipe. If asked about something unrelated, politely redirect.
3. **Portion recalculation**: If the user asks to cook for a different number of people (e.g., "I want to make this for 8 people" when the recipe is for ${recipe.servings}), dynamically recalculate ALL ingredient quantities proportionally and present a clean updated ingredient list.
4. **Substitutions & tips**: Suggest ingredient substitutions if asked, explain techniques, and share professional cooking tips relevant to the steps.
5. **Time estimates**: Help users estimate timing and when to start preparing parallel tasks.

RULES:
- Always be warm, encouraging, and conversational.
- Refer to the recipe steps and ingredients precisely using the data above.
- Never make up ingredients or steps not in the recipe.
- When recalculating portions, show the calculation clearly.
- Use emojis sparingly to keep a friendly tone.
- Start by briefly introducing yourself and asking how you can help with the recipe.`;
};

// @desc    Send message to AI, maintain session
// @route   POST /api/chat/:recipeId
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { recipeId } = req.params;
    const userId = req.user._id;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Fetch the recipe for context
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Find or create chat session
    let session = await ChatSession.findOne({ userId, recipeId });
    if (!session) {
      session = await ChatSession.create({
        userId,
        recipeId,
        messagesHistory: [],
      });
    }

    // Build the Gemini conversation history from session
    // Gemini expects { role: 'user' | 'model', parts: [{ text: string }] }
    const history = session.messagesHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

const systemPrompt = buildSystemPrompt(recipe);
    
    // SDK güncel olduğu için artık systemInstruction'a doğrudan string'i verebiliriz!
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // gemini-pro yerine bunu kullanıyoruz
      systemInstruction: systemPrompt 
    });

    // startChat sadece history'yi alıyor
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(message.trim());
    const aiResponse = result.response.text();

    // Save both user message and AI response to session
    session.messagesHistory.push(
      { role: 'user', content: message.trim() },
      { role: 'model', content: aiResponse }
    );

    // Keep session history manageable (last 50 messages = 25 exchanges)
    if (session.messagesHistory.length > 50) { 
      session.messagesHistory = session.messagesHistory.slice(-50);
    }

    await session.save();

    res.json({
      reply: aiResponse,
      sessionId: session._id,
      messageCount: session.messagesHistory.length,
    });
  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ message: 'AI service error: ' + error.message });
  }
};

// @desc    Get existing chat session history
// @route   GET /api/chat/:recipeId
const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      userId: req.user._id,
      recipeId: req.params.recipeId,
    });

    if (!session) {
      return res.json({ messagesHistory: [] });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear chat session history
// @route   DELETE /api/chat/:recipeId
const clearSession = async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({
      userId: req.user._id,
      recipeId: req.params.recipeId,
    });
    res.json({ message: 'Chat session cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getSession, clearSession };
