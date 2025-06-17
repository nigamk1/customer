const Chat = require('../models/Chat');
const WebsiteIntegration = require('../models/WebsiteIntegration');
const mongoose = require('mongoose');

// @desc    Get analytics for an integration
// @route   GET /api/analytics/:integrationId
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { startDate, endDate } = req.query;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get chats for this integration within the date range
    const chats = await Chat.find({
      integrationId,
      createdAt: { $gte: start, $lte: end }
    });
    
    // Calculate metrics
    const totalChats = chats.length;
    
    // Calculate feedback metrics
    const feedbackStats = chats.reduce((stats, chat) => {
      if (chat.feedback) {
        stats.total++;
        if (chat.feedback.helpful) stats.helpful++;
        if (chat.feedback.rating) stats.totalRating += chat.feedback.rating;
      }
      return stats;
    }, { total: 0, helpful: 0, totalRating: 0 });
    
    // Calculate escalation metrics
    const escalatedChats = chats.filter(chat => chat.escalated).length;
    
    // Calculate resolution rate
    const resolvedChats = chats.filter(chat => !chat.escalated && 
      (chat.feedback?.helpful || chat.feedback?.rating >= 4)).length;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    chats.forEach(chat => {
      const userMessages = chat.messages.filter(msg => msg.role === 'user');
      const assistantMessages = chat.messages.filter(msg => msg.role === 'assistant');
      
      userMessages.forEach((userMsg, index) => {
        if (index < assistantMessages.length) {
          const userTime = new Date(userMsg.timestamp).getTime();
          const assistantTime = new Date(assistantMessages[index].timestamp).getTime();
          const responseTime = assistantTime - userTime;
          
          if (responseTime > 0) {
            totalResponseTime += responseTime;
            responseTimeCount++;
          }
        }
      });
    });
    
    const avgResponseTime = responseTimeCount > 0 
      ? totalResponseTime / responseTimeCount / 1000 // in seconds
      : 0;
    
    // Calculate message counts
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    
    // Calculate chat duration
    const chatDurations = chats.map(chat => {
      if (chat.messages.length < 2) return 0;
      const start = new Date(chat.messages[0].timestamp).getTime();
      const end = new Date(chat.messages[chat.messages.length - 1].timestamp).getTime();
      return (end - start) / 1000; // in seconds
    });
    
    const avgChatDuration = chatDurations.length > 0
      ? chatDurations.reduce((sum, duration) => sum + duration, 0) / chatDurations.length
      : 0;
    
    res.json({
      totalChats,
      feedback: {
        total: feedbackStats.total,
        helpfulRate: feedbackStats.total > 0 ? feedbackStats.helpful / feedbackStats.total : 0,
        averageRating: feedbackStats.total > 0 ? feedbackStats.totalRating / feedbackStats.total : 0
      },
      escalationRate: totalChats > 0 ? escalatedChats / totalChats : 0,
      resolutionRate: totalChats > 0 ? resolvedChats / totalChats : 0,
      avgResponseTime,
      avgMessagesPerChat: totalChats > 0 ? totalMessages / totalChats : 0,
      avgChatDuration
    });
    
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ 
      message: 'Error retrieving analytics', 
      error: err.message
    });
  }
};

// @desc    Get chat logs for an integration
// @route   GET /api/analytics/:integrationId/logs
// @access  Private
exports.getChatLogs = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { startDate, endDate, page, limit, filterBy } = req.query;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build filter
    const filter = {
      integrationId,
      createdAt: { $gte: start, $lte: end }
    };
    
    // Apply additional filters
    if (filterBy === 'escalated') {
      filter.escalated = true;
    } else if (filterBy === 'helpful') {
      filter['feedback.helpful'] = true;
    } else if (filterBy === 'unhelpful') {
      filter['feedback.helpful'] = false;
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;
    
    // Get chats with pagination
    const chats = await Chat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('title messages createdAt feedback escalated');
    
    // Get total count for pagination
    const total = await Chat.countDocuments(filter);
    
    res.json({
      logs: chats,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize)
      }
    });
    
  } catch (err) {
    console.error('Chat logs error:', err);
    res.status(500).json({ 
      message: 'Error retrieving chat logs', 
      error: err.message
    });
  }
};

// @desc    Get frequently asked questions based on chat history
// @route   GET /api/analytics/:integrationId/faqs
// @access  Private
exports.getFrequentQuestions = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { limit } = req.query;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Get chats from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Aggregate user messages and count frequency
    const questions = await Chat.aggregate([
      {
        $match: {
          integrationId: mongoose.Types.ObjectId(integrationId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $unwind: '$messages' },
      {
        $match: {
          'messages.role': 'user'
        }
      },
      {
        $group: {
          _id: '$messages.content',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) || 10 }
    ]);
    
    res.json({
      frequentQuestions: questions.map(q => ({
        question: q._id,
        frequency: q.count
      }))
    });
    
  } catch (err) {
    console.error('Frequent questions error:', err);
    res.status(500).json({ 
      message: 'Error retrieving frequent questions', 
      error: err.message
    });
  }
};
