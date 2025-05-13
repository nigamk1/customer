const WebsiteIntegration = require('../models/WebsiteIntegration');
const Chat = require('../models/Chat');
const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

    // Prepare context with better structured prompting
    const domainName = integration.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    // Create base system prompt
    let systemPrompt = `You are a helpful customer service AI assistant for the website ${domainName}. You help customers with questions about products, services, pricing, and support.

IMPORTANT INSTRUCTIONS:
1. Your task is to provide accurate, specific answers based on the context provided about ${domainName}.
2. If the user's question relates to specific content on the current page, use that information first.
3. If the user asks something not covered in the context, acknowledge the limitation and suggest that they reach out for more information.
4. Always be polite, professional, and helpful in your tone.
5. Never make up information. Stick to what's provided in the context.
6. If the user asks about placing an order or specific account questions, explain that you can provide information but they'll need to complete the transaction through the website's regular checkout/account process.
`;
    
    // Add structured context data sections
    let contextSections = [];
    
    // Add current page context with high priority
    if (metadata && metadata.pageContent) {
      contextSections.push({
        title: "CURRENT PAGE INFORMATION",
        content: metadata.pageContent.trim().substring(0, 3000),
        priority: 1
      });
    }
    
    // Add knowledge base documents
    if (integration.knowledgeBase && integration.knowledgeBase.enabled) {
      // Add documents from knowledge base
      if (integration.knowledgeBase.documents && integration.knowledgeBase.documents.length > 0) {
        const docsContent = integration.knowledgeBase.documents.map(doc => 
          `${doc.name}: ${doc.content.substring(0, 1000)}`
        ).join('\n\n');
        
        contextSections.push({
          title: "KNOWLEDGE BASE DOCUMENTS",
          content: docsContent,
          priority: 2
        });
      }
      
      // Add scraped information from URLs in knowledge base
      if (integration.knowledgeBase.urls && integration.knowledgeBase.urls.length > 0) {
        try {
          // Use Promise.all to scrape multiple URLs in parallel
          const scrapedContents = await Promise.all(
            integration.knowledgeBase.urls.map(async url => {
              try {
                // First check if this URL would be particularly relevant to the user's query
                // This helps prioritize the most relevant content
                const urlLower = url.toLowerCase();
                const messageLower = message.toLowerCase();
                const urlRelevanceScore = calculateRelevanceScore(urlLower, messageLower);
                
                const response = await axios.get(url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                  },
                  timeout: 10000
                });
                
                const $ = cheerio.load(response.data);
                
                // Remove script, style, and other non-content elements
                $('script, style, nav, footer, header, .menu, .sidebar, [role="navigation"], .navigation').remove();
                
                // Extract text from main content areas with higher priority
                let mainContent = '';
                // Target common content containers
                $('main, article, .content, .product-description, .product-details, #content, .main-content, [role="main"]').each((i, el) => {
                  mainContent += $(el).text() + ' ';
                });
                
                // If no specific content areas found, fall back to body
                let pageText = mainContent || $('body').text();
                
                // Clean up the text
                pageText = pageText.replace(/\s+/g, ' ').trim();
                
                // Get page title
                const pageTitle = $('title').text().trim();
                
                // Get meta description
                const metaDescription = $('meta[name="description"]').attr('content') || '';
                
                return {
                  url,
                  title: pageTitle,
                  description: metaDescription,
                  content: pageText.substring(0, 3000),
                  relevanceScore: urlRelevanceScore
                };
              } catch (error) {
                console.error(`Error scraping ${url}:`, error.message);
                return {
                  url,
                  title: "Error retrieving content",
                  description: "",
                  content: "",
                  relevanceScore: 0
                };
              }
            })
          );
          
          // Sort scraped content by relevance
          const sortedContent = scrapedContents
            .filter(item => item.content) // Filter out empty contents
            .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance score
          
          // Only use the top most relevant pages to avoid context bloat
          const topRelevantPages = sortedContent.slice(0, 3);
          
          if (topRelevantPages.length > 0) {
            const urlsContent = topRelevantPages.map(page => 
              `PAGE: ${page.title || page.url}\nDESCRIPTION: ${page.description}\nCONTENT: ${page.content.substring(0, 1500)}`
            ).join('\n\n---\n\n');
            
            contextSections.push({
              title: "WEBSITE PAGES",
              content: urlsContent,
              priority: 3
            });
          }
        } catch (error) {
          console.error('Error processing knowledge base URLs:', error);
        }
      }
    }
    
    // Sort context sections by priority
    contextSections.sort((a, b) => a.priority - b.priority);
    
    // Build final context
    let contextData = '';
    for (const section of contextSections) {
      contextData += `\n\n### ${section.title} ###\n${section.content}\n`;
    }
    
    // Add the context to the system prompt
    if (contextData) {
      systemPrompt += `\n\nREFERENCE INFORMATION: Use the following information to accurately answer questions about ${domainName}:${contextData}`;
    }
    
    // Add final instruction to guide responses when information is missing
    systemPrompt += `\n\nIf there's anything you're not sure about that isn't covered in the reference information above, be transparent about it. Say something like: "Based on the information I have, I can't provide a complete answer about [topic]. For more details, you may want to [appropriate next step like: check the specific product page, contact customer support, etc.]."`;

    // System message for AI to understand its role
    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };
    
    let chat;
    
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
      } else {
        // Replace the first system message with updated context
        if (chat.messages.length > 0 && chat.messages[0].role === 'system') {
          chat.messages[0] = systemMessage;
        } else {
          // If no system message exists, add it at the beginning
          chat.messages.unshift(systemMessage);
        }
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
    
    // Determine appropriate token limits based on context length
    const contextLength = systemPrompt.length;
    const maxTokens = contextLength > 8000 ? 1000 : (contextLength > 4000 ? 1500 : 2000);
    
    // Call OpenAI API with dynamic token limits based on context size
    const response = await openai.chat.completions.create({
      model: 'gpt-4',  // Using GPT-4 for better context understanding
      messages: apiMessages,
      max_tokens: maxTokens,
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

// Helper function to calculate relevance score between a URL and a user message
function calculateRelevanceScore(url, message) {
  let score = 0;
  
  // Split the message into keywords
  const keywords = message.split(/\s+/).filter(word => word.length > 3);
  
  // Check if any keywords appear in the URL
  for (const keyword of keywords) {
    if (url.includes(keyword)) {
      score += 3;
    }
  }
  
  // Give higher score to likely product pages
  if (url.includes('/product') || url.includes('/item') || url.includes('/p/')) {
    score += 2;
  }
  
  // Give higher score to FAQ/Help pages for support questions
  if (url.includes('/faq') || url.includes('/help') || url.includes('/support')) {
    if (message.includes('how') || message.includes('what') || 
        message.includes('guide') || message.includes('help') || 
        message.includes('support') || message.includes('issue')) {
      score += 3;
    }
  }
  
  // Give higher score to pricing/plan pages for pricing questions
  if (url.includes('/price') || url.includes('/pricing') || url.includes('/plan') || url.includes('/subscription')) {
    if (message.includes('cost') || message.includes('price') || 
        message.includes('subscription') || message.includes('plan') || 
        message.includes('payment') || message.includes('discount')) {
      score += 3;
    }
  }
  
  return score;
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
      // For Word docs, mention that text extraction would be implemented with a library like mammoth.js
      docContent = 'Document content extraction from Word documents would be implemented in production.';
      
      // In a real implementation, you would use a library like mammoth.js:
      // const mammoth = require('mammoth');
      // const result = await mammoth.extractRawText({path: filePath});
      // docContent = result.value;
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