/**
 * HelpMate AI Chat Widget
 * A customizable chat widget for websites using HelpMate AI customer support
 */

(function() {
  // Configuration
  const config = window.HelpMateAI || {};
  const apiKey = config.apiKey || '';
  const position = config.position || 'bottom-right';
  const primaryColor = config.primaryColor || '#4F46E5';
  const chatTitle = config.chatTitle || 'Customer Support';
  const welcomeMessage = config.welcomeMessage || 'Hi there! How can I help you today?';
  const isDemoMode = config.demoMode || false;
  const demoType = config.demoType || '';
  const demoConfig = config.demoConfig || null;
  
  // Dynamically determine base URL
  // This ensures we use the same domain in production or development
  const getBaseUrl = () => {
    // If explicitly provided in config, use that
    if (config.baseUrl) return config.baseUrl;
    
    // Get the current script URL
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    
    if (currentScript && currentScript.src) {
      // Extract domain from script source
      const scriptUrl = new URL(currentScript.src);
      return scriptUrl.origin; // Returns just the origin part (protocol + domain + port)
    }
    
    // Fallback to localhost if we can't determine
    return 'https://customer-ai-support.onrender.com';
  };
  
  // Base URL for API requests
  const baseUrl = getBaseUrl();
  
  // State
  let isOpen = false;
  let chatHistory = [];
  let chatId = localStorage.getItem('helpmateAI_chatId') || null;
  let visitorId = localStorage.getItem('helpmateAI_visitorId') || generateId();
  
  // Save visitor ID for session tracking
  localStorage.setItem('helpmateAI_visitorId', visitorId);
  
  // Create and inject styles
  injectStyles();
  
  // Create widget elements
  const widgetContainer = createWidgetContainer();
  const chatButton = createChatButton();
  const chatWindow = createChatWindow();
  
  // Add elements to the DOM
  widgetContainer.appendChild(chatButton);
  widgetContainer.appendChild(chatWindow);
  document.body.appendChild(widgetContainer);
  
  // Event listeners
  chatButton.addEventListener('click', toggleChat);
  
  // Send a welcome message from the AI when opened for the first time
  if (!localStorage.getItem('helpmateAI_welcomed')) {
    chatHistory.push({
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    });
    localStorage.setItem('helpmateAI_welcomed', 'true');
    renderChatMessages();
  }
  
  /**
   * Helper functions
   */
   
  // Generate a random ID
  function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Toggle chat open/closed
  function toggleChat() {
    isOpen = !isOpen;
    
    if (isOpen) {
      chatWindow.style.display = 'flex';
      setTimeout(() => {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'translateY(0)';
      }, 50);
      chatButton.querySelector('.helpmate-chat-icon').style.display = 'none';
      chatButton.querySelector('.helpmate-close-icon').style.display = 'block';
      chatButton.style.backgroundColor = '#f44336';
      renderChatMessages();
    } else {
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'translateY(20px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);
      chatButton.querySelector('.helpmate-chat-icon').style.display = 'block';
      chatButton.querySelector('.helpmate-close-icon').style.display = 'none';
      chatButton.style.backgroundColor = primaryColor;
    }
  }
  
  // Collect page content for context
  function collectPageContent() {
    try {
      // If in demo mode, provide pre-set context instead of scraping
      if (isDemoMode && demoConfig) {
        return generateDemoContext();
      }
      
      // Create structured page data object
      let pageData = {
        type: '',
        title: document.title,
        url: window.location.href,
        mainContent: '',
        productInfo: '',
        pricing: '',
        categories: [],
        pageMetadata: {}
      };
      
      // Detect page type based on URL and content
      if (window.location.pathname.includes('/product') || document.querySelector('.product, .product-detail, #product')) {
        pageData.type = 'product';
      } else if (window.location.pathname.includes('/category') || document.querySelector('.category, .products-list')) {
        pageData.type = 'category';
      } else if (window.location.pathname.includes('/cart') || document.querySelector('.cart, .checkout')) {
        pageData.type = 'cart';
      } else if (window.location.pathname.includes('/faq') || document.querySelector('.faq, .faqs')) {
        pageData.type = 'faq';
      } else if (window.location.pathname.includes('/contact') || document.querySelector('.contact, .contact-us')) {
        pageData.type = 'contact';
      } else if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        pageData.type = 'homepage';
      }

      // Get product information with higher priority
      const productElements = document.querySelectorAll('.product, .product-info, .product-details, .product-description, .service-description, [itemtype*="Product"]');
      if (productElements.length > 0) {
        let productData = '';
        for (let el of productElements) {
          // Extract specific product attributes where available
          const name = el.querySelector('[itemprop="name"], .product-name, .product-title, h1')?.textContent;
          const description = el.querySelector('[itemprop="description"], .product-description, .description')?.textContent;
          const price = el.querySelector('[itemprop="price"], .price, .product-price')?.textContent;
          const sku = el.querySelector('[itemprop="sku"], .sku')?.textContent;
          const brand = el.querySelector('[itemprop="brand"], .brand')?.textContent;
          
          if (name) productData += `Product: ${name.trim()}\n`;
          if (description) productData += `Description: ${description.trim()}\n`;
          if (price) productData += `Price: ${price.trim()}\n`;
          if (sku) productData += `SKU: ${sku.trim()}\n`;
          if (brand) productData += `Brand: ${brand.trim()}\n`;
          
          // If no structured data, get the full text
          if (!productData) {
            productData += el.textContent.replace(/\s+/g, ' ').trim() + '\n';
          }
        }
        pageData.productInfo = productData;
      }
      
      // Look for pricing information
      const priceElements = document.querySelectorAll('.price, .pricing, .product-price, .price-list, [itemprop="price"]');
      if (priceElements.length > 0) {
        let priceData = 'Pricing information: ';
        for (let el of priceElements) {
          priceData += el.textContent.trim() + ' ';
        }
        pageData.pricing = priceData.trim();
      }
      
      // Look for navigation/categories to understand site structure
      const navElements = document.querySelectorAll('nav, .navigation, .main-menu, .categories');
      if (navElements.length > 0) {
        for (let nav of navElements) {
          const links = nav.querySelectorAll('a');
          for (let link of links) {
            if (link.textContent.trim()) {
              pageData.categories.push(link.textContent.trim());
            }
          }
        }
      }
      
      // Extract meta tags for additional context
      const metaTags = document.querySelectorAll('meta[name], meta[property]');
      if (metaTags.length > 0) {
        for (let tag of metaTags) {
          const name = tag.getAttribute('name') || tag.getAttribute('property');
          const content = tag.getAttribute('content');
          if (name && content && (name.includes('description') || name.includes('keywords') || name.includes('title'))) {
            pageData.pageMetadata[name] = content;
          }
        }
      }
      
      // If no specific elements found, try common content areas for main content
      if (!pageData.mainContent) {
        const contentElements = document.querySelectorAll('main, article, .content, #content, .main-content');
        if (contentElements.length > 0) {
          for (let el of contentElements) {
            pageData.mainContent += el.textContent.replace(/\s+/g, ' ').trim() + ' ';
          }
        }
      }
      
      // If still no content, get body text but limit it
      if (!pageData.mainContent && !pageData.productInfo) {
        pageData.mainContent = document.body.textContent.replace(/\s+/g, ' ').trim().substring(0, 2000);
      }
      
      // Convert to string representation for API transport
      let contextString = `Page Type: ${pageData.type || 'Unknown'}\nURL: ${pageData.url}\nTitle: ${pageData.title}\n`;
      
      if (pageData.productInfo) contextString += `\n${pageData.productInfo}`;
      if (pageData.pricing) contextString += `\n${pageData.pricing}`;
      if (pageData.categories.length > 0) contextString += `\nCategories: ${pageData.categories.join(', ')}\n`;
      if (pageData.mainContent) contextString += `\nMain Content: ${pageData.mainContent.substring(0, 1500)}\n`;
      
      // Add metadata if available
      if (Object.keys(pageData.pageMetadata).length > 0) {
        contextString += '\nPage Metadata:\n';
        for (const [key, value] of Object.entries(pageData.pageMetadata)) {
          contextString += `${key}: ${value}\n`;
        }
      }
      
      return contextString;
    } catch (error) {
      console.error('Error collecting page content:', error);
      return 'Unable to collect page content due to an error.';
    }
  }

  // Generate demo context for the demo mode
  function generateDemoContext() {
    if (!demoConfig) return '';

    if (demoType === 'ecommerce') {
      return `
Page Type: Product
URL: ${window.location.href}
Title: ${demoConfig.productName} | ${demoConfig.companyName}

Product: ${demoConfig.productName}
Price: ${demoConfig.productPrice}
Description: ${demoConfig.productDescription}

Features:
${demoConfig.productFeatures.map(feature => `- ${feature}`).join('\n')}

Shipping Information:
${demoConfig.shipping}

Return Policy:
${demoConfig.returns}

Company: ${demoConfig.companyName}
      `.trim();
    } 
    else if (demoType === 'saas') {
      return `
Page Type: Pricing
URL: ${window.location.href}
Title: Pricing Plans | ${demoConfig.productName}

Product: ${demoConfig.productName}
Plans:
${demoConfig.plans.map(plan => 
  `Plan: ${plan.name}
  Price: ${plan.price}
  Features: ${plan.features.join(', ')}`
).join('\n')}

FAQ:
${demoConfig.faq.map(item => 
  `Q: ${item.question}
  A: ${item.answer}`
).join('\n')}

Company: ${demoConfig.companyName}
      `.trim();
    }
    
    return '';
  }
  
  // Send a message to the AI
  function sendMessage(message) {
    if (!message.trim()) return;
    
    // Add the user message to chat history
    chatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Add a loading message
    const loadingId = 'loading-' + Date.now();
    chatHistory.push({
      id: loadingId,
      role: 'loading',
      content: 'Thinking...',
      timestamp: new Date()
    });
    
    renderChatMessages();
    
    // Get current page content for better context
    const pageContent = collectPageContent();
    
    // Call the API
    fetch(`${baseUrl}/api/integration/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        message,
        chatId,
        visitorId,
        metadata: {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
          pageContent: pageContent,
          isDemoMode: isDemoMode, 
          demoType: demoType
        }
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .then(data => {
      // Remove the loading message
      chatHistory = chatHistory.filter(msg => msg.id !== loadingId);
      
      // Save the chat ID for continuing the conversation
      if (data.chatId) {
        chatId = data.chatId;
        localStorage.setItem('helpmateAI_chatId', chatId);
      }
      
      // Add the AI response to chat history
      chatHistory.push({
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      });
      
      renderChatMessages();
    })
    .catch(error => {
      console.error('Error sending message:', error);
      
      // Remove the loading message
      chatHistory = chatHistory.filter(msg => msg.id !== loadingId);
      
      // If in demo mode and error occurs, simulate a response
      if (isDemoMode) {
        let demoResponse = "I can help answer questions about ";
        
        if (demoType === 'ecommerce') {
          demoResponse += `the ${demoConfig.productName}. It costs ${demoConfig.productPrice} and features ${demoConfig.productFeatures.join(', ')}. For shipping, ${demoConfig.shipping.toLowerCase()}`;
        } else if (demoType === 'saas') {
          demoResponse += `our ${demoConfig.productName} plans and pricing. We offer ${demoConfig.plans.map(p => p.name).join(', ')} plans, starting at ${demoConfig.plans[0].price}.`;
        } else {
          demoResponse += "this website and the products/services offered here.";
        }
        
        // Add demo response
        chatHistory.push({
          role: 'assistant',
          content: demoResponse,
          timestamp: new Date()
        });
      } else {
        // Add error message
        chatHistory.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
          timestamp: new Date()
        });
      }
      
      renderChatMessages();
    });
  }
  
  // Render chat messages
  function renderChatMessages() {
    const chatMessagesContainer = document.getElementById('helpmate-chat-messages');
    if (!chatMessagesContainer) return;
    
    chatMessagesContainer.innerHTML = '';
    
    chatHistory.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('helpmate-message');
      
      if (message.role === 'user') {
        messageElement.classList.add('helpmate-user-message');
        messageElement.innerHTML = `
          <div class="helpmate-message-bubble">
            <div class="helpmate-message-text">${message.content}</div>
            <div class="helpmate-message-time">${formatTime(message.timestamp)}</div>
          </div>
        `;
      } else if (message.role === 'assistant') {
        messageElement.classList.add('helpmate-ai-message');
        messageElement.innerHTML = `
          <div class="helpmate-message-bubble">
            <div class="helpmate-message-text">${message.content}</div>
            <div class="helpmate-message-time">${formatTime(message.timestamp)}</div>
          </div>
        `;
      } else if (message.role === 'loading') {
        messageElement.classList.add('helpmate-ai-message', 'helpmate-loading-message');
        messageElement.innerHTML = `
          <div class="helpmate-message-bubble">
            <div class="helpmate-message-text">
              <div class="helpmate-loading-dots">
                <div class="helpmate-loading-dot"></div>
                <div class="helpmate-loading-dot"></div>
                <div class="helpmate-loading-dot"></div>
              </div>
            </div>
          </div>
        `;
      }
      
      chatMessagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
  
  // Format timestamp to readable time
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Inject CSS styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Chat widget styles */
      #helpmate-widget-container {
        position: fixed;
        z-index: 999999;
        /* Position will be set based on configuration */
      }
      
      #helpmate-chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        font-size: 24px;
        color: white;
        transition: all 0.3s ease;
      }
      
      #helpmate-chat-window {
        position: absolute;
        width: 350px;
        height: 500px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
        bottom: 70px;
        right: 0;
      }
      
      #helpmate-chat-header {
        padding: 15px;
        color: white;
        font-weight: bold;
      }
      
      #helpmate-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background-color: #f5f8fb;
      }
      
      #helpmate-chat-input-container {
        display: flex;
        padding: 10px;
        border-top: 1px solid #e0e0e0;
      }
      
      #helpmate-chat-input {
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 8px 12px;
        resize: none;
        outline: none;
        font-family: inherit;
        margin-right: 10px;
      }
      
      #helpmate-send-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      
      .helpmate-message {
        margin-bottom: 15px;
      }
      
      .helpmate-user-message {
        text-align: right;
      }
      
      .helpmate-message-bubble {
        display: inline-block;
        max-width: 80%;
        padding: 12px;
        border-radius: 18px;
      }
      
      .helpmate-user-message .helpmate-message-bubble {
        background-color: ${primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .helpmate-ai-message .helpmate-message-bubble {
        background-color: white;
        color: #333;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 4px;
      }
      
      .helpmate-message-time {
        font-size: 10px;
        opacity: 0.7;
        margin-top: 4px;
      }
      
      .helpmate-loading-dots {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 20px;
      }
      
      .helpmate-loading-dot {
        width: 8px;
        height: 8px;
        background: #999;
        border-radius: 50%;
        margin: 0 3px;
        animation: bounce 1.4s infinite ease-in-out both;
      }
      
      .helpmate-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .helpmate-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Create the widget container
  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'helpmate-widget-container';
    
    // Position the widget based on configuration
    switch (position) {
      case 'bottom-right':
        container.style.right = '20px';
        container.style.bottom = '20px';
        break;
      case 'bottom-left':
        container.style.left = '20px';
        container.style.bottom = '20px';
        break;
      case 'top-right':
        container.style.right = '20px';
        container.style.top = '20px';
        break;
      case 'top-left':
        container.style.left = '20px';
        container.style.top = '20px';
        break;
    }
    
    return container;
  }
  
  // Create the chat button
  function createChatButton() {
    const button = document.createElement('div');
    button.id = 'helpmate-chat-button';
    button.style.backgroundColor = primaryColor;
    
    // Using message/chat icon instead of question mark
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px" class="helpmate-chat-icon">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px" class="helpmate-close-icon" style="display: none;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    
    return button;
  }
  
  // Create the chat window
  function createChatWindow() {
    const window = document.createElement('div');
    window.id = 'helpmate-chat-window';
    
    // Adjust position based on container position
    if (position.includes('left')) {
      window.style.left = '0';
    } else {
      window.style.right = '0';
    }
    
    if (position.includes('top')) {
      window.style.top = '70px';
      window.style.bottom = 'auto';
    }
    
    window.innerHTML = `
      <div id="helpmate-chat-header" style="background-color: ${primaryColor}">
        <div id="helpmate-chat-title">${chatTitle}</div>
      </div>
      <div id="helpmate-chat-messages"></div>
      <div id="helpmate-chat-input-container">
        <textarea 
          id="helpmate-chat-input" 
          placeholder="Type your message here..."
          rows="1"
        ></textarea>
        <button id="helpmate-send-button" style="background-color: ${primaryColor}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;
    
    // Add event listener once the window is in the DOM
    setTimeout(() => {
      const sendButton = document.getElementById('helpmate-send-button');
      const inputField = document.getElementById('helpmate-chat-input');
      
      if (sendButton && inputField) {
        sendButton.addEventListener('click', () => {
          sendMessage(inputField.value);
          inputField.value = '';
        });
        
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputField.value);
            inputField.value = '';
          }
        });
        
        // Auto resize the input field
        inputField.addEventListener('input', () => {
          inputField.style.height = 'auto';
          inputField.style.height = (inputField.scrollHeight < 100) ? 
            inputField.scrollHeight + 'px' : '100px';
        });
      }
    }, 100);
    
    return window;
  }
})();