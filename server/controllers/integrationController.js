const WebsiteIntegration = require('../models/WebsiteIntegration');
const Chat = require('../models/Chat');
const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// @desc    Create new website integration
// @route   POST /api/integration
// @access  Private
exports.createIntegration = async (req, res) => {
  try {
    const { name, domain, widgetSettings, knowledgeBase } = req.body;

    // Create new integration
    const integration = new WebsiteIntegration({
      user: req.user.id,
      name,
      domain,
      widgetSettings: widgetSettings || {},
      knowledgeBase: knowledgeBase || {}
    });

    await integration.save();

    res.status(201).json({
      success: true,
      data: integration
    });
  } catch (err) {
    console.error('Create integration error:', err);
    res.status(500).json({ message: 'Error creating integration' });
  }
};

// @desc    Get all integrations for user
// @route   GET /api/integration
// @access  Private
exports.getIntegrations = async (req, res) => {
  try {
    const integrations = await WebsiteIntegration.find({ user: req.user.id });

    res.json({ success: true, data: integrations });
  } catch (err) {
    console.error('Get integrations error:', err);
    res.status(500).json({ message: 'Error retrieving integrations' });
  }
};

// @desc    Get single integration
// @route   GET /api/integration/:id
// @access  Private
exports.getIntegration = async (req, res) => {
  try {
    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    res.json({ success: true, data: integration });
  } catch (err) {
    console.error('Get integration error:', err);
    res.status(500).json({ message: 'Error retrieving integration' });
  }
};

// @desc    Update integration
// @route   PUT /api/integration/:id
// @access  Private
exports.updateIntegration = async (req, res) => {
  try {
    const { name, domain, widgetSettings, knowledgeBase, active } = req.body;

    let integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    // Update fields
    if (name) integration.name = name;
    if (domain) integration.domain = domain;
    if (widgetSettings) integration.widgetSettings = { ...integration.widgetSettings, ...widgetSettings };
    if (knowledgeBase) integration.knowledgeBase = { ...integration.knowledgeBase, ...knowledgeBase };
    if (active !== undefined) integration.active = active;

    await integration.save();

    res.json({ success: true, data: integration });
  } catch (err) {
    console.error('Update integration error:', err);
    res.status(500).json({ message: 'Error updating integration' });
  }
};

// @desc    Delete integration
// @route   DELETE /api/integration/:id
// @access  Private
exports.deleteIntegration = async (req, res) => {
  try {
    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    await integration.remove();

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Delete integration error:', err);
    res.status(500).json({ message: 'Error deleting integration' });
  }
};

// @desc    Generate new API key
// @route   POST /api/integration/:id/generate-key
// @access  Private
exports.generateApiKey = async (req, res) => {
  try {
    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    const crypto = require('crypto');
    integration.apiKey = crypto.randomBytes(16).toString('hex');

    await integration.save();

    res.json({
      success: true,
      apiKey: integration.apiKey
    });
  } catch (err) {
    console.error('Generate API key error:', err);
    res.status(500).json({ message: 'Error generating API key' });
  }
};

// @desc    Process chat from external website
// @route   POST /api/integration/chat
// @access  Public (with API key)
exports.processExternalChat = async (req, res) => {
  try {
    const { apiKey, message, chatId, visitorId, metadata } = req.body;

    if (!apiKey || !message) {
      return res.status(400).json({ message: 'API key and message are required' });
    }

    // Find integration by API key
    const integration = await WebsiteIntegration.findOne({ apiKey, active: true });

    if (!integration) {
      return res.status(401).json({ message: 'Invalid or inactive API key' });
    }

    // Prepare system message with website context
    let systemPrompt = `You are a helpful customer service assistant for the website ${integration.domain}.`;
    
    // Add knowledge base context if enabled
    let contextData = '';
    
    if (integration.knowledgeBase && integration.knowledgeBase.enabled) {
      // If there's knowledge base URLs, scrape them for context
      if (integration.knowledgeBase.urls && integration.knowledgeBase.urls.length > 0) {
        for (const url of integration.knowledgeBase.urls) {
          try {
            const scrapeResponse = await axios.get(url);
            const $ = cheerio.load(scrapeResponse.data);
            // Extract text content, strip HTML, and clean up whitespace
            const pageText = $('body').text().replace(/\s+/g, ' ').trim();
            contextData += `Content from ${url}: ${pageText.substring(0, 1000)} [...]\n\n`;
          } catch (error) {
            console.error(`Error scraping ${url}:`, error.message);
          }
        }
      }

      // Add stored document content if available
      if (integration.knowledgeBase.documents && integration.knowledgeBase.documents.length > 0) {
        integration.knowledgeBase.documents.forEach(doc => {
          contextData += `${doc.name}: ${doc.content.substring(0, 1000)} [...]\n\n`;
        });
      }
    }
    
    if (contextData) {
      systemPrompt += ` Use the following information to answer questions accurately: ${contextData}`;
    }

    systemPrompt += ` Always provide accurate and helpful responses to customer inquiries. If you don't know the answer, suggest the customer reaches out to a human agent.`;

    // System message for AI to understand its role
    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };
    
    let chat;
    let messages = [systemMessage];
    
    // If this is a continuation of an existing chat
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        // Create new chat with the given chatId
        chat = new Chat({
          _id: chatId,
          user: integration.user,
          messages: [systemMessage],
          title: `Website Chat - ${integration.domain}`
        });
      }
    } else {
      // Create new chat
      chat = new Chat({
        user: integration.user,
        messages: [systemMessage],
        title: `Website Chat - ${integration.domain}`
      });
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
      model: 'gpt-4',  // or other suitable model
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
    
    // Save chat
    await chat.save();
    
    // Send response back to client
    res.json({ 
      response: aiResponse,
      chatId: chat._id
    });
    
  } catch (err) {
    console.error('External chat error:', err);
    res.status(500).json({ message: 'Error processing chat request' });
  }
};

// @desc    Add URL to knowledge base
// @route   POST /api/integration/:id/knowledge/url
// @access  Private
exports.addKnowledgeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    // Enable knowledge base if not already enabled
    if (!integration.knowledgeBase.enabled) {
      integration.knowledgeBase.enabled = true;
    }

    // Add URL if not already in list
    if (!integration.knowledgeBase.urls.includes(url)) {
      integration.knowledgeBase.urls.push(url);
    }

    await integration.save();

    res.json({ 
      success: true, 
      urls: integration.knowledgeBase.urls 
    });
  } catch (err) {
    console.error('Add knowledge URL error:', err);
    res.status(500).json({ message: 'Error adding URL to knowledge base' });
  }
};

// @desc    Remove URL from knowledge base
// @route   DELETE /api/integration/:id/knowledge/url
// @access  Private
exports.removeKnowledgeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    // Remove URL from list
    integration.knowledgeBase.urls = integration.knowledgeBase.urls.filter(u => u !== url);

    await integration.save();

    res.json({ 
      success: true, 
      urls: integration.knowledgeBase.urls 
    });
  } catch (err) {
    console.error('Remove knowledge URL error:', err);
    res.status(500).json({ message: 'Error removing URL from knowledge base' });
  }
};

// @desc    Get chat widget code
// @route   GET /api/integration/:id/widget-code
// @access  Private
exports.getWidgetCode = async (req, res) => {
  try {
    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    // Create the widget code snippet
    const widgetCode = `
<script>
  (function(w, d, s, o) {
    w.HelpMateAI = o;
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(o.scriptId)) return;
    js = d.createElement(s); js.id = o.scriptId;
    js.src = "${process.env.NODE_ENV === 'production' ? 'https://customer-ai-support.onrender.com/widget.js' : 'http://localhost:5000'}/widget.js";
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', {
    scriptId: 'helpmate-widget',
    apiKey: '${integration.apiKey}',
    position: '${integration.widgetSettings.position || 'bottom-right'}',
    primaryColor: '${integration.widgetSettings.primaryColor || '#4F46E5'}',
    chatTitle: '${integration.widgetSettings.chatTitle || 'Customer Support'}',
    welcomeMessage: '${integration.widgetSettings.welcomeMessage || 'Hi there! How can I help you today?'}'
  }));
</script>
`.trim();

    res.json({
      success: true,
      widgetCode
    });
  } catch (err) {
    console.error('Get widget code error:', err);
    res.status(500).json({ message: 'Error generating widget code' });
  }
};