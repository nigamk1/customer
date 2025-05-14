const WebsiteIntegration = require('../models/WebsiteIntegration');
const Chat = require('../models/Chat');
const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for document storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

exports.upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Session storage for external chat conversations (in-memory for now)
// In production, replace with Redis or a database solution
const conversationStore = new Map();

// Helper function to retrieve conversation history
async function getConversationHistory(sessionId) {
  return conversationStore.get(sessionId);
}

// Helper function to save conversation history
async function saveConversationHistory(sessionId, conversation) {
  // Limit history to most recent 20 messages to prevent token overflow
  if (conversation.length > 20) {
    // Keep system prompt and most recent messages
    const systemMessages = conversation.filter(msg => msg.role === 'system');
    const nonSystemMessages = conversation
      .filter(msg => msg.role !== 'system')
      .slice(-15); // Keep last 15 non-system messages
    
    conversation = [...systemMessages, ...nonSystemMessages];
  }
  
  conversationStore.set(sessionId, conversation);
  
  // Set expiration for session (24 hours)
  setTimeout(() => {
    if (conversationStore.has(sessionId)) {
      conversationStore.delete(sessionId);
    }
  }, 24 * 60 * 60 * 1000);
}

// @desc    Create new website integration
// @route   POST /api/integration
// @access  Private
exports.createIntegration = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { name, domain, widgetSettings, knowledgeBase, allowFileAttachments, active } = req.body;
    
    // Create integration
    const integration = new WebsiteIntegration({
      user: userId,
      name,
      domain,
      widgetSettings,
      knowledgeBase,
      allowFileAttachments,
      active
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

// @desc    Process chat messages from external websites
// @route   POST /api/integration/chat
// @access  Public
exports.processExternalChat = async (req, res) => {
  try {
    const { apiKey, message, chatId, visitorId, metadata } = req.body;
    
    if (!apiKey) {
      return res.status(401).json({ message: 'API Key is required' });
    }
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Find integration by API key
    const integration = await WebsiteIntegration.findOne({ apiKey, active: true });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found or not active' });
    }
    
    // Initialize chat session ID if not provided
    const sessionId = chatId || visitorId || generateSessionId();

    // Create system prompt based on integration settings
    const systemPrompt = await generateSystemPrompt(integration, metadata);
    
    // Get page context from metadata if available
    const pageContext = metadata?.pageContent || '';
    
    // Retrieve conversation history from session store or initialize new conversation
    let conversation = await getConversationHistory(sessionId);
    if (!conversation) {
      conversation = [
        { role: 'system', content: systemPrompt }
      ];
    }
    
    // Add current page context as additional system message if relevant
    if (pageContext) {
      const contextMsg = `The user is currently on page: ${metadata?.url || 'unknown'}. 
Current page content summary: ${pageContext.substring(0, 300)}...
Use this context to provide a more relevant response.`;
      
      // Add page context message just for this API call (don't store in history)
      conversation.push({ role: 'system', content: contextMsg });
    }
    
    // Add user message to conversation
    conversation.push({ role: 'user', content: message });
    
    // Call OpenAI API with context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Use GPT-4 for best quality responses
      messages: conversation,
      temperature: 0.7,
      max_tokens: 800,
      top_p: 1,
    });

    // Get AI response
    const aiResponse = completion.choices[0].message.content;
    
    // Add AI response to conversation history
    conversation.push({ role: 'assistant', content: aiResponse });
    
    // Save conversation history (exclude the page context message)
    await saveConversationHistory(sessionId, 
      conversation.filter(msg => !(msg.role === 'system' && msg.content.includes('Current page content summary')))
    );
    
    // For demo purposes, if demo mode and specified in metadata, provide special handling
    if (metadata?.isDemoMode && metadata?.demoType) {
      // Additional demo handling could be done here if needed
    }

    // Send response back to client
    res.json({ 
      response: aiResponse,
      chatId: sessionId
    });
  } catch (err) {
    console.error('External chat error:', err);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

// Helper function to generate a session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to generate system prompt based on integration settings
async function generateSystemPrompt(integration, metadata) {
  const websiteName = extractDomainName(integration.domain);
  
  // Build a comprehensive system prompt
  let systemPrompt = `You are HelpMate AI, a helpful customer service assistant for ${websiteName}. 
Provide accurate, friendly, and concise answers based on the website content and knowledge base provided.
  
When responding to customers:
1. If you find specific information in the reference materials, use that to provide accurate answers.
2. When answering about products, services, or policies, only state facts found in the provided context.
3. For questions about pricing, shipping, or specific features, refer precisely to the information given.
4. If information isn't available in the context, politely acknowledge this and offer to help find it or suggest contacting ${websiteName} directly.
5. Always maintain a helpful, professional tone aligned with ${websiteName}'s brand.
6. Keep responses concise and directly address the customer's query.

`;

  // Add company information if available
  if (integration.companyInfo) {
    systemPrompt += `\nABOUT ${websiteName.toUpperCase()}:\n${integration.companyInfo}\n`;
  }

  // Add custom welcome message if set
  if (integration.widgetSettings.welcomeMessage) {
    systemPrompt += `\nWhen greeting users, use a tone consistent with: "${integration.widgetSettings.welcomeMessage}"\n`;
  }

  // Add brand voice guidance if available
  if (integration.brandVoice) {
    systemPrompt += `\nBRAND VOICE GUIDANCE:\n${integration.brandVoice}\n`;
  }

  // Detect page type to provide more specific instructions based on metadata
  if (metadata?.url) {
    const urlLower = metadata.url.toLowerCase();
    
    // Detect page type from URL
    if (urlLower.includes('product') || urlLower.includes('item') || urlLower.includes('shop')) {
      systemPrompt += `\nThe user appears to be viewing a product page. Prioritize product information in your responses.\n`;
    } else if (urlLower.includes('faq') || urlLower.includes('help') || urlLower.includes('support')) {
      systemPrompt += `\nThe user is viewing help content. Be especially thorough in answering their questions.\n`;
    } else if (urlLower.includes('pricing') || urlLower.includes('plans') || urlLower.includes('subscription')) {
      systemPrompt += `\nThe user is viewing pricing information. Be precise about costs and features.\n`;
    } else if (urlLower.includes('checkout') || urlLower.includes('cart') || urlLower.includes('payment')) {
      systemPrompt += `\nThe user appears to be in the checkout process. Focus on addressing payment, shipping, and order-related queries.\n`;
    }
  }
  
  // If page content metadata is provided, use it for more specific context
  if (metadata?.pageContent) {
    const contentLower = metadata.pageContent.toLowerCase();
    
    if (contentLower.includes('product') && (contentLower.includes('price') || contentLower.includes('buy'))) {
      systemPrompt += `\nThe user is viewing product details. Focus on answering questions about product features, pricing, and availability.\n`;
    } else if (contentLower.includes('shipping') || contentLower.includes('delivery')) {
      systemPrompt += `\nThe user is viewing shipping information. Be precise about delivery policies, timelines, and costs when relevant.\n`;
    } else if (contentLower.includes('return') || contentLower.includes('refund')) {
      systemPrompt += `\nThe user is viewing return policy information. Provide accurate details about the return process, eligibility, and refund timelines.\n`;
    }
  }
  
  // Add contextual parameters for more natural responses based on customer information if available
  if (metadata?.visitorData) {
    if (metadata.visitorData.returningVisitor) {
      systemPrompt += `\nThis is a returning visitor to the website. Consider this when providing assistance.\n`;
    }
    
    if (metadata.visitorData.location) {
      systemPrompt += `\nThe visitor appears to be from ${metadata.visitorData.location}. Consider regional context when appropriate.\n`;
    }
    
    if (metadata.visitorData.previousPurchases && metadata.visitorData.previousPurchases.length > 0) {
      systemPrompt += `\nThis customer has previously purchased from ${websiteName}. They may have questions about existing orders or products they've purchased.\n`;
    }
  }

  return systemPrompt;
}

// Helper function to extract domain name from URL
function extractDomainName(url) {
  try {
    // Remove protocol and get domain
    let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    // Remove path if any
    domain = domain.split('/')[0];
    // Make it presentable
    domain = domain.charAt(0).toUpperCase() + domain.slice(1);
    return domain;
  } catch (error) {
    console.error("Error extracting domain:", error);
    return "your website";
  }
}

// Helper function to extract relevant context from knowledge base
async function extractRelevantKnowledgeContext(integration, query) {
  let contextContent = '';
  
  try {
    // Check for documents in knowledge base
    if (integration.knowledgeBase.documents && integration.knowledgeBase.documents.length > 0) {
      // Process documents for relevant context
      for (const doc of integration.knowledgeBase.documents) {
        if (doc.content) {
          contextContent += `\nFrom document "${doc.name}":\n${doc.content.substring(0, 2000)}\n`;
        }
      }
    }
    
    // Check for URLs in knowledge base
    if (integration.knowledgeBase.urls && integration.knowledgeBase.urls.length > 0) {
      // Only grab content from first 2 URLs to avoid API overload
      const urlsToProcess = integration.knowledgeBase.urls.slice(0, 2);
      
      for (const url of urlsToProcess) {
        try {
          const response = await axios.get(url, {
            timeout: 5000,
            headers: {
              'User-Agent': 'HelpMate AI Knowledge Base Indexer',
            }
          });
          
          if (response.status === 200) {
            const $ = cheerio.load(response.data);
            
            // Extract main content (prioritize article, main content divs)
            let pageContent = '';
            const contentSelectors = ['article', 'main', '.main-content', '.content', '#content'];
            
            for (const selector of contentSelectors) {
              if ($(selector).length) {
                pageContent = $(selector).text();
                break;
              }
            }
            
            // If no specific content found, use body text
            if (!pageContent) {
              pageContent = $('body').text();
            }
            
            // Clean up and truncate content
            pageContent = pageContent.replace(/\s+/g, ' ').trim();
            if (pageContent.length > 3000) {
              pageContent = pageContent.substring(0, 3000);
            }
            
            contextContent += `\nFrom URL ${url}:\n${pageContent}\n`;
          }
        } catch (error) {
          console.error(`Error fetching URL ${url}:`, error.message);
        }
      }
    }
    
    if (contextContent) {
      // If we have a lot of context, try to summarize it
      if (contextContent.length > 6000) {
        contextContent = await summarizeContent(query, contextContent);
      }
    }
    
    return contextContent;
  } catch (error) {
    console.error('Error extracting knowledge context:', error);
    return '';
  }
}

// Helper function to intelligently prioritize context based on relevance to query
function prioritizeContext(query, pageContext, knowledgeContext) {
  // Combine all contexts, but prioritize them for token efficiency
  let combinedContext = '';
  const queryLower = query.toLowerCase();
  
  // Detect key topics in the query
  const isProductQuery = queryLower.includes('product') || 
    queryLower.includes('item') || 
    queryLower.includes('buy') ||
    queryLower.includes('purchase') ||
    queryLower.includes('how much');
  
  const isShippingQuery = queryLower.includes('shipping') || 
    queryLower.includes('delivery') || 
    queryLower.includes('when will') || 
    queryLower.includes('arrive');
  
  const isPricingQuery = queryLower.includes('price') || 
    queryLower.includes('cost') || 
    queryLower.includes('discount') || 
    queryLower.includes('sale');
  
  // Prioritize current page context if it matches query type
  if (pageContext) {
    const pageContextLower = pageContext.toLowerCase();
    const pageHasProductInfo = pageContextLower.includes('product') && 
      (pageContextLower.includes('price') || pageContextLower.includes('description'));
    
    const pageHasShippingInfo = pageContextLower.includes('shipping') || 
      pageContextLower.includes('delivery');
    
    const pageHasPricingInfo = pageContextLower.includes('price') || 
      pageContextLower.includes('pricing') || 
      pageContextLower.includes('cost');
    
    // If query aligns with page content, prioritize it
    if ((isProductQuery && pageHasProductInfo) || 
        (isShippingQuery && pageHasShippingInfo) || 
        (isPricingQuery && pageHasPricingInfo)) {
      combinedContext = pageContext;
      
      // If we have knowledge content, add the most relevant parts
      if (knowledgeContext) {
        // Very basic approach - add first 2000 chars of knowledge context
        combinedContext += '\n\nAdditional information:\n' + knowledgeContext.substring(0, 2000);
      }
    } else {
      // If page doesn't have relevant info, prioritize knowledge base
      if (knowledgeContext) {
        combinedContext = knowledgeContext;
        
        // Add page context as secondary information
        combinedContext += '\n\nCurrent page information:\n' + pageContext;
      } else {
        combinedContext = pageContext;
      }
    }
  } else if (knowledgeContext) {
    // No page context, use knowledge base only
    combinedContext = knowledgeContext;
  }
  
  return combinedContext;
}

// Function to summarize long content
async function summarizeContent(query, content) {
  try {
    // Use OpenAI to summarize long content with focus on query relevance
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `Summarize the following content to extract the most relevant information related to this query: "${query}". 
                    Focus on facts, figures, product details, policies and information that would help answer the query.
                    Keep important details like product names, prices, shipping policies, return policies intact.
                    Limit to 1500 words.`
        },
        { 
          role: 'user', 
          content: content 
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    // If summarization fails, just truncate the content
    return content.substring(0, 4000) + '... (content truncated)';
  }
}

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

// @desc    Upload document to knowledge base
// @route   POST /api/integration/:id/knowledge/document
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
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

    // Initialize documents array if it doesn't exist
    if (!integration.knowledgeBase.documents) {
      integration.knowledgeBase.documents = [];
    }

    // Extract text from document based on file type
    let docContent = '';
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase();
    
    if (fileExt === '.pdf') {
      // Extract text from PDF
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      
      try {
        const pdfData = await pdfParse(dataBuffer);
        docContent = pdfData.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        docContent = 'Error extracting content from PDF.';
      }
    } else if (fileExt === '.txt' || fileExt === '.md' || fileExt === '.rtf') {
      // Read text files directly
      docContent = fs.readFileSync(filePath, 'utf8');
    } else if (fileExt === '.doc' || fileExt === '.docx') {
      // For Word docs, provide a placeholder message - would need mammoth.js in production
      docContent = 'Document content extraction from Word documents would be implemented in production.';
    }

    // Clean up the extracted text
    docContent = docContent.replace(/\r\n/g, '\n').replace(/\n\n+/g, '\n\n').trim();

    // Add document to knowledge base
    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      name: fileName,
      content: docContent,
      url: filePath,
      uploadedAt: new Date()
    };

    integration.knowledgeBase.documents.push(newDocument);
    await integration.save();

    res.json({ 
      success: true, 
      document: {
        id: newDocument._id,
        name: newDocument.name,
        uploadedAt: newDocument.uploadedAt
      }
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ message: 'Error uploading document' });
  }
};

// @desc    Remove document from knowledge base
// @route   DELETE /api/integration/:id/knowledge/document/:documentId
// @access  Private
exports.removeDocument = async (req, res) => {
  try {
    const integration = await WebsiteIntegration.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    // Find the document in the knowledge base
    const documentId = req.params.documentId;
    const documentIndex = integration.knowledgeBase.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the document to delete the file from disk
    const document = integration.knowledgeBase.documents[documentIndex];

    // Remove from disk if file exists
    if (document.url && fs.existsSync(document.url)) {
      fs.unlinkSync(document.url);
    }

    // Remove from the array
    integration.knowledgeBase.documents.splice(documentIndex, 1);
    await integration.save();

    res.json({ 
      success: true, 
      message: 'Document removed successfully'
    });
  } catch (err) {
    console.error('Remove document error:', err);
    res.status(500).json({ message: 'Error removing document' });
  }
};