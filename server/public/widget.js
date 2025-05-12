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
      chatButton.innerHTML = '&times;';
      chatButton.style.backgroundColor = '#f44336';
      renderChatMessages();
    } else {
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'translateY(20px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);
      chatButton.innerHTML = '?';
      chatButton.style.backgroundColor = primaryColor;
    }
  }
  
  // Collect page content for context
  function collectPageContent() {
    try {
      // Get main content
      let mainContent = '';
      
      // Look for product information
      const productElements = document.querySelectorAll('.product, .product-info, .product-details, .product-description, .service-description');
      if (productElements.length > 0) {
        for (let el of productElements) {
          mainContent += el.textContent + ' ';
        }
      }
      
      // Look for pricing information
      const priceElements = document.querySelectorAll('.price, .pricing, .product-price');
      if (priceElements.length > 0) {
        mainContent += 'Pricing information: ';
        for (let el of priceElements) {
          mainContent += el.textContent + ' ';
        }
      }
      
      // If no specific elements found, try common content areas
      if (!mainContent) {
        const contentElements = document.querySelectorAll('main, article, .content, #content, .main-content');
        if (contentElements.length > 0) {
          for (let el of contentElements) {
            mainContent += el.textContent + ' ';
          }
        }
      }
      
      // Clean up the content
      mainContent = mainContent.replace(/\s+/g, ' ').trim();
      
      // Limit length
      if (mainContent.length > 1000) {
        mainContent = mainContent.substring(0, 1000);
      }
      
      return mainContent;
    } catch (error) {
      console.error('Error collecting page content:', error);
      return '';
    }
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
          pageContent: pageContent
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
      
      // Add error message
      chatHistory.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      });
      
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
        z-index: 9999;
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
    button.innerHTML = '?';
    
    return button;
  }
  
  // Create the chat window
  function createChatWindow() {
    const window = document.createElement('div');
    window.id = 'helpmate-chat-window';
    
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