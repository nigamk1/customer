const Chat = require('../models/Chat');
const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// @desc    Send message to AI
// @route   POST /api/chat/send
// @access  Private/Public
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    let userId = req.user ? req.user.id : null;
    let chatId = req.body.chatId;
    
    // System message for AI to understand its role
    const systemMessage = {
      role: 'system',
      content: 'You are HelpMate AI, a helpful customer service assistant. Provide concise, accurate, and friendly responses to customer queries.'
    };
    
    let chat;
    
    // If authenticated user and has an existing chat
    if (userId && chatId) {
      chat = await Chat.findOne({ _id: chatId, user: userId });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    } 
    // If authenticated user but no chat specified, create new chat
    else if (userId && !chatId) {
      chat = new Chat({
        user: userId,
        messages: [systemMessage]
      });
    } 
    // For guests (no user ID), create a temporary chat (will be saved if they register later)
    else {
      // For guest users, we'll just use the OpenAI API directly without storing in DB
      chat = {
        messages: [systemMessage]
      };
    }
    
    // Add user message to chat history
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Prepare messages for API call (exclude timestamps)
    const apiMessages = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',  // or 'gpt-3.5-turbo' for a cheaper option
      messages: apiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    // Get AI response
    const aiResponse = response.choices[0].message.content;
    
    // Add AI response to chat history
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });
    
    // If it's a real chat (not guest), save to DB
    if (userId) {
      await chat.save();
    }
    
    // Send response back to client
    res.json({ 
      response: aiResponse,
      chatId: userId ? chat._id : null
    });
    
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = req.query.chatId;
    
    if (chatId) {
      // Get specific chat
      const chat = await Chat.findOne({ _id: chatId, user: userId });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      return res.json(chat.messages);
    } else {
      // Get all chats
      const chats = await Chat.find({ user: userId })
        .sort({ updatedAt: -1 });
      return res.json(chats);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit feedback for a chat
// @route   POST /api/chat/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { chatId, rating, comment } = req.body;
    
    if (!chatId || !rating) {
      return res.status(400).json({ message: 'ChatId and rating are required' });
    }
    
    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    chat.feedback = {
      rating,
      comment: comment || ''
    };
    
    await chat.save();
    
    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Escalate chat to human agent
// @route   POST /api/chat/escalate
// @access  Private
exports.escalateToHuman = async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ message: 'ChatId is required' });
    }
    
    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    chat.escalatedToHuman = true;
    chat.messages.push({
      role: 'system',
      content: 'This conversation has been escalated to a human agent. An agent will respond shortly.',
      timestamp: new Date()
    });
    
    await chat.save();
    
    // TODO: Notify available human agents via socket.io
    
    res.json({ 
      success: true, 
      message: 'Chat escalated to human agent successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
