const Chat = require('../models/Chat');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const WebsiteIntegration = require('../models/WebsiteIntegration');
const { OpenAI } = require('openai');

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.replace(/^"(.*)"$/, '$1') : '';
const openai = new OpenAI({ apiKey });

// @desc    Send message to AI
// @route   POST /api/chat/send
// @access  Private/Public
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    let userId = req.user ? req.user.id : null;
    let chatId = req.body.chatId;
    let integrationId = req.body.integrationId;
    
    // Check subscription limits if authenticated user
    if (userId) {
      const user = await User.findById(userId);
      
      if (user && user.isSubscribed) {
        // Check subscription limits
        const subscription = await Subscription.findOne({ user: userId, status: 'active' });
        if (subscription) {
          // If user has reached chat limit
          if (subscription.chatsUsed >= subscription.chatLimit) {
            return res.status(403).json({ 
              message: 'You have reached your monthly chat limit. Please upgrade your plan for unlimited chats.'
            });
          }
          // Increment chats used
          subscription.chatsUsed += 1;
          await subscription.save();
        }
      }
    }
    
    // Get integration details if integrationId is provided
    let integrationDetails = null;
    let customSystemPrompt = null;
    if (integrationId) {
      integrationDetails = await WebsiteIntegration.findById(integrationId);
      if (!integrationDetails) {
        return res.status(404).json({ message: 'Integration not found' });
      }
        // Check if integration has knowledge base enabled
      if (integrationDetails.knowledgeBase && integrationDetails.knowledgeBase.enabled) {
        if (integrationDetails.knowledgeBase.vectorSearch && integrationDetails.knowledgeBase.vectorSearch.enabled) {
          // Use RAG approach with vector similarity search
          const { buildContextFromVectorSearch } = require('../services/chatService');
          const vectorSearchContext = await buildContextFromVectorSearch(integrationDetails, message);
          
          if (vectorSearchContext) {
            customSystemPrompt = `You are HelpMate AI, a helpful customer service assistant for ${integrationDetails.name}.
Use the following information to provide accurate, helpful, and friendly responses to customer queries.
When you don't know the answer, say so politely and suggest contacting a human representative.

${vectorSearchContext}

Respond in a conversational, helpful tone. Keep responses concise yet thorough.`;
          } else {
            // Fall back to traditional knowledge base if no vector search results
            customSystemPrompt = await buildContextFromKnowledgeBase(integrationDetails);
          }
        } else {
          // Build context from traditional knowledge base
          customSystemPrompt = await buildContextFromKnowledgeBase(integrationDetails);
        }
      }
      
      // Check for trigger keywords that require special handling
      if (integrationDetails.businessRules && integrationDetails.businessRules.triggerKeywords) {
        const { checkForTriggerKeywords } = require('../services/chatService');
        const trigger = checkForTriggerKeywords(
          message, 
          integrationDetails.businessRules.triggerKeywords
        );
        
        if (trigger && trigger.action === 'escalate') {
          // Auto-escalate based on trigger keyword
          return res.json({ 
            response: "I'll need to transfer you to a human agent to assist with this query.",
            escalated: true,
            triggerKeyword: trigger.keyword
          });
        }
      }
      
      // Check if within business hours
      if (integrationDetails.businessRules && 
          integrationDetails.businessRules.businessHours && 
          integrationDetails.businessRules.businessHours.enabled) {
        
        const { isWithinBusinessHours } = require('../services/chatService');
        const withinHours = isWithinBusinessHours(integrationDetails.businessRules.businessHours);
        
        if (!withinHours) {
          // Return out-of-hours message
          return res.json({ 
            response: integrationDetails.businessRules.businessHours.outOfHoursMessage || 
              "We're currently outside of our business hours. Please leave a message and we'll get back to you soon.",
            outOfHours: true
          });
        }
      }
    }
    
    // System message for AI to understand its role
    const systemMessage = {
      role: 'system',
      content: customSystemPrompt || 'You are HelpMate AI, a helpful customer service assistant. Provide concise, accurate, and friendly responses to customer queries.'
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
      // Prepare API call options
    const apiOptions = {
      model: 'gpt-4',  // or 'gpt-3.5-turbo' for a cheaper option
      messages: apiMessages,
      max_tokens: 800,
      temperature: 0.7,
    };
    
    // Add tool definitions if integration has tools configured
    if (integrationId && integrationDetails && integrationDetails.toolsConfig) {
      const { getAvailableToolSchemas } = require('../services/toolService');
      const tools = getAvailableToolSchemas(integrationDetails);
      
      if (tools && tools.length > 0) {
        apiOptions.tools = tools;
        apiOptions.tool_choice = 'auto';
      }
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create(apiOptions);
    
    // Process the response
    const aiMessage = response.choices[0].message;
    
    // Check if the AI used any tools
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      // Process tool calls
      const { processToolCalls } = require('../services/chatService');
      const toolResults = await processToolCalls(integrationDetails, aiMessage.tool_calls);
      
      // Add the assistant's message with tool calls
      chat.messages.push({
        role: 'assistant',
        content: aiMessage.content,
        tool_calls: aiMessage.tool_calls,
        timestamp: new Date()
      });
      
      // Add tool results to messages
      toolResults.forEach(result => {
        chat.messages.push({
          ...result,
          timestamp: new Date()
        });
      });
      
      // Make a follow-up call to get the final response
      const followUpMessages = [...apiMessages, aiMessage, ...toolResults];
      
      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: followUpMessages,
        max_tokens: 800,
        temperature: 0.7,
      });
      
      // Get final AI response
      const aiResponse = followUpResponse.choices[0].message.content;
      
      // Add final AI response to chat history
      chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      
      // For the response object
      var finalResponse = aiResponse;
    } else {
      // Standard text response
      const aiResponse = aiMessage.content;
      
      // Add AI response to chat history
      chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      
      // For the response object
      var finalResponse = aiResponse;
    }
    
    // If it's a real chat (not guest), save to DB
    if (userId) {
      // Auto-generate a title based on first user message if this is a new chat
      if (!chat.title || chat.title === 'New Conversation') {
        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'Generate a short, concise title (5 words max) for a conversation that starts with this message. Return only the title with no quotes or additional text.' 
            },
            { role: 'user', content: message }
          ],
          max_tokens: 15,
          temperature: 0.3,
        });
        
        chat.title = titleResponse.choices[0].message.content.replace(/["']/g, '').trim();
      }
      
      // Update the chat's updatedAt timestamp
      chat.updatedAt = new Date();
      await chat.save();
    }
      // Send response back to client
    res.json({ 
      response: finalResponse,
      chatId: userId ? chat._id : null,
      usedKnowledgeBase: !!customSystemPrompt,
      usedTools: !!(aiMessage.tool_calls && aiMessage.tool_calls.length > 0)
    });
    
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

/**
 * Build context from knowledge base
 * @param {Object} integration - WebsiteIntegration document
 * @returns {String} - Context for the AI
 */
async function buildContextFromKnowledgeBase(integration) {
  try {
    let context = '';
    
    // Add company information and brand voice
    if (integration.companyInfo) {
      context += `COMPANY INFORMATION:\n${integration.companyInfo}\n\n`;
    }
    
    // Add FAQ knowledge base
    if (integration.knowledgeBase && integration.knowledgeBase.faqs && integration.knowledgeBase.faqs.length > 0) {
      context += 'FREQUENTLY ASKED QUESTIONS:\n';
      integration.knowledgeBase.faqs.forEach(faq => {
        context += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      });
    }
    
    // Add URL content knowledge base
    if (integration.knowledgeBase && integration.knowledgeBase.urls && integration.knowledgeBase.urls.length > 0) {
      context += 'WEBSITE CONTENT:\n';
      integration.knowledgeBase.urls.forEach(url => {
        if (url.content) {
          context += `Page: ${url.url}\nContent: ${url.content.substring(0, 1000)}...\n\n`;
        }
      });
    }
    
    // Add document content knowledge base
    if (integration.knowledgeBase && integration.knowledgeBase.documents && integration.knowledgeBase.documents.length > 0) {
      context += 'DOCUMENT CONTENT:\n';
      integration.knowledgeBase.documents.forEach(doc => {
        if (doc.content) {
          context += `Document: ${doc.name}\nContent: ${doc.content.substring(0, 1000)}...\n\n`;
        }
      });
    }
    
    // Return general prompt if no specific context is available
    if (!context) {
      return 'You are HelpMate AI, a helpful customer service assistant. Provide concise, accurate, and friendly responses to customer queries.';
    }
    
    // Create a tailored system prompt with knowledge context
    return `You are HelpMate AI, a helpful customer service assistant for ${integration.websiteName || 'this company'}. 
Use the following information to provide accurate, helpful, and friendly responses to customer queries.
When you don't know the answer, say so politely and suggest contacting a human representative.

${context}

Respond in a conversational, helpful tone. Keep responses concise yet thorough.`;
  } catch (err) {
    console.error('Error building knowledge base context:', err);
    return 'You are HelpMate AI, a helpful customer service assistant. Provide concise, accurate, and friendly responses to customer queries.';
  }
}

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
      return res.json(chat);
    } else {
      // Get all chats
      const chats = await Chat.find({ user: userId })
        .select('-messages') // Exclude messages to reduce payload size
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

// @desc    Delete a chat
// @route   DELETE /api/chat/:chatId
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    const chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    await Chat.deleteOne({ _id: chatId });
    
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get analytics for chats
// @route   GET /api/chat/analytics
// @access  Private
exports.getChatAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Count total chats
    const totalChats = await Chat.countDocuments({ 
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Count escalated chats
    const escalatedChats = await Chat.countDocuments({ 
      user: userId,
      escalatedToHuman: true,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Get average feedback rating (excluding null ratings)
    const feedbackResult = await Chat.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate },
          'feedback.rating': { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$feedback.rating' },
          ratedChats: { $sum: 1 }
        }
      }
    ]);
    
    const averageRating = feedbackResult.length > 0 ? feedbackResult[0].averageRating : 0;
    const ratedChats = feedbackResult.length > 0 ? feedbackResult[0].ratedChats : 0;
    
    // Get total messages
    const messageResult = await Chat.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          messageCount: { $size: '$messages' }
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$messageCount' }
        }
      }
    ]);
    
    const totalMessages = messageResult.length > 0 ? messageResult[0].totalMessages : 0;
    
    // Get chats per day for the time period
    const chatsByDay = await Chat.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      totalChats,
      escalatedChats,
      escalationRate: totalChats > 0 ? (escalatedChats / totalChats) * 100 : 0,
      averageRating,
      ratedChats,
      totalMessages,
      messagesPerChat: totalChats > 0 ? totalMessages / totalChats : 0,
      chatsByDay: chatsByDay.map(day => ({
        date: day._id,
        count: day.count
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
