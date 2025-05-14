// HelpMate AI Demo Page Script
document.addEventListener('DOMContentLoaded', function() {
  // Demo configuration
  const demoConfig = {
    apiKey: 'demo-api-key', // This will be replaced by server with actual demo API key
    widgetSettings: {
      primaryColor: '#4F46E5',
      position: 'bottom-right',
      chatTitle: 'HelpMate AI Demo',
      welcomeMessage: 'Welcome to HelpMate AI! I can help answer questions based on the current page content and knowledge base.'
    }
  };

  // DOM elements
  const chatContainer = document.getElementById('chat-container');
  const messagesList = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const pageSelectorForm = document.getElementById('page-selector-form');
  const contextDisplay = document.getElementById('context-display');
  const activeContextDisplay = document.getElementById('active-context');

  // Demo state
  let chatSessionId = null;
  let currentPage = 'product';
  let currentContext = pageContexts.product;
  
  // Set initial page context
  updatePageContext(currentPage);
  
  // Initialize the chat interface
  initChat();

  // Event listener for message sending
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Event listener for page context switching
  pageSelectorForm.addEventListener('change', function(e) {
    if (e.target.name === 'pageContext') {
      currentPage = e.target.value;
      updatePageContext(currentPage);
      
      // Add system message indicating context change
      addSystemMessage(`Context switched to ${currentPage} page`);
    }
  });

  // Function to initialize the chat
  function initChat() {
    // Clear any existing messages
    messagesList.innerHTML = '';
    
    // Add welcome message
    addBotMessage(demoConfig.widgetSettings.welcomeMessage);
    
    // Focus on the input field
    messageInput.focus();
  }

  // Function to send a message
  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Add user message to the chat
    addUserMessage(message);
    
    // Clear input
    messageInput.value = '';
    
    // Mock loading state
    addLoadingIndicator();
    
    // Prepare context data based on current page
    const contextData = {
      url: `https://example.com/${currentPage}`,
      pageContent: currentContext.content,
      isDemoMode: true,
      demoType: currentPage,
      visitorData: {
        returningVisitor: true,
        location: 'United States',
        previousPurchases: currentPage === 'account' ? ['Premium Plan', 'Additional User License'] : []
      }
    };
    
    // Send to API
    fetch('/api/integration/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: demoConfig.apiKey,
        message,
        chatId: chatSessionId,
        metadata: contextData
      })
    })
    .then(response => response.json())
    .then(data => {
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Display response
      if (data.response) {
        addBotMessage(data.response);
        
        // Update chat session ID if needed
        if (data.chatId && !chatSessionId) {
          chatSessionId = data.chatId;
        }
      } else if (data.message) {
        addSystemMessage('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error sending message:', error);
      removeLoadingIndicator();
      addSystemMessage('Sorry, there was an error processing your request.');
    });
  }

  // Function to update the visible page context
  function updatePageContext(pageType) {
    currentContext = pageContexts[pageType] || pageContexts.product;
    
    // Update the context display
    contextDisplay.innerHTML = `
      <h3>${currentContext.title}</h3>
      <div class="context-content">
        ${currentContext.displayHtml}
      </div>
    `;
    
    // Update active context indicator
    activeContextDisplay.textContent = `Active Context: ${currentContext.title}`;
    
    // Highlight the active page in the tabs
    document.querySelectorAll('.page-option').forEach(option => {
      if (option.value === pageType) {
        option.checked = true;
      }
    });
  }

  // Helper function to add a user message
  function addUserMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message user-message';
    messageEl.innerHTML = `<div class="message-content">${formatMessageText(text)}</div>`;
    messagesList.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
  }

  // Helper function to add a bot message
  function addBotMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message bot-message';
    messageEl.innerHTML = `
      <div class="bot-avatar">
        <img src="/icon.svg" alt="HelpMate AI" />
      </div>
      <div class="message-content">${formatMessageText(text)}</div>
    `;
    messagesList.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
  }

  // Helper function to add a system message
  function addSystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system-message';
    messageEl.textContent = text;
    messagesList.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
  }

  // Helper function to add loading indicator
  function addLoadingIndicator() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message bot-message loading';
    loadingEl.id = 'loading-indicator';
    loadingEl.innerHTML = `
      <div class="bot-avatar">
        <img src="/icon.svg" alt="HelpMate AI" />
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    messagesList.appendChild(loadingEl);
    
    // Scroll to bottom
    scrollToBottom();
  }

  // Helper function to remove loading indicator
  function removeLoadingIndicator() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
      messagesList.removeChild(loadingEl);
    }
  }

  // Helper function to scroll chat to bottom
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Helper function to format message text with Markdown/HTML
  function formatMessageText(text) {
    // Basic formatting (you could use a Markdown library for more robust parsing)
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
});

// Demo page contexts
const pageContexts = {
  product: {
    title: 'Product Page',
    content: `
      SkyScanner X3000 Premium Drone
      
      Price: $899.99 (Regular: $1,099.99)
      
      Product Description:
      The SkyScanner X3000 is our flagship drone featuring 4K ultra HD video recording, 3-axis gimbal stabilization, and 35 minutes of flight time. Perfect for professional aerial photography and videography.
      
      Key Features:
      • 4K Ultra HD Camera: Capture stunning aerial footage at 60fps
      • 3-Axis Gimbal Stabilization: Ultra-smooth footage even in windy conditions
      • 35-Minute Flight Time: Industry-leading battery performance
      • 7km Transmission Range: Stay connected from a distance
      • Obstacle Avoidance: 6-direction sensing system
      • Foldable Design: Compact and portable
      
      Technical Specifications:
      • Weight: 795g
      • Dimensions: 214×91×84 mm (folded)
      • Max Speed: 68 kph (Sport mode)
      • Operating Temperature: 32° to 104°F (0° to 40°C)
      • Battery: 5200mAh LiPo 4S
      
      Package Includes:
      • SkyScanner X3000 Drone
      • Remote Controller
      • 2x Flight Batteries
      • Battery Charging Hub
      • Carrying Case
      • Spare Propellers (2 pairs)
      • User Manual
      
      Warranty: 1-year limited warranty
      
      Shipping: Free 2-day shipping on all orders
      
      Returns: 30-day return policy. Must be in original packaging.
    `,
    displayHtml: `
      <div class="product-demo">
        <h2>SkyScanner X3000 Premium Drone</h2>
        <div class="product-price">$899.99 <span class="original-price">$1,099.99</span></div>
        
        <h4>Product Description:</h4>
        <p>The SkyScanner X3000 is our flagship drone featuring 4K ultra HD video recording, 3-axis gimbal stabilization, and 35 minutes of flight time.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li>4K Ultra HD Camera</li>
          <li>3-Axis Gimbal Stabilization</li>
          <li>35-Minute Flight Time</li>
          <li>7km Transmission Range</li>
        </ul>
        
        <div class="shipping-info">
          <p><strong>Free 2-day shipping</strong> on all orders</p>
          <p><strong>30-day return policy</strong></p>
        </div>
      </div>
    `
  },
  faq: {
    title: 'FAQ Page',
    content: `
      Frequently Asked Questions
      
      Order & Shipping
      
      Q: How long does shipping take?
      A: Domestic orders typically arrive within 2-5 business days. International shipping may take 7-14 business days. Premium members get free 2-day shipping on all orders.
      
      Q: Do you ship internationally?
      A: Yes! We ship to over 50 countries worldwide. International shipping costs are calculated at checkout based on destination and package weight.
      
      Q: Can I modify or cancel my order after it's placed?
      A: Orders can be modified or canceled within 1 hour of placing them. After that time, orders enter our fulfillment process and can no longer be changed. Please contact customer support immediately if you need to make changes.
      
      Returns & Refunds
      
      Q: What is your return policy?
      A: We offer a 30-day return policy on most products. Items must be in their original packaging and in unused condition. Some electronics must be returned within 14 days. Special orders and customized products cannot be returned.
      
      Q: How do I initiate a return?
      A: Log in to your account, go to order history, and select the "Return Item" option next to the relevant product. You'll receive a prepaid return shipping label via email. Once we receive and inspect the returned item, a refund will be processed within 3-5 business days.
      
      Q: Do you offer warranty on products?
      A: Yes, our premium drones come with a 1-year limited warranty covering manufacturing defects. Extended warranties are available for purchase during checkout.
      
      Technical Support
      
      Q: How do I activate my drone for the first time?
      A: Download our mobile app, create an account, and follow the in-app activation process. Make sure your drone firmware is updated to the latest version before your first flight.
      
      Q: My drone won't connect to the controller, what should I do?
      A: First, ensure both the drone and controller are fully charged. Turn both devices off, then turn on the controller first, followed by the drone. If the issue persists, try resetting the connection by pressing and holding the pairing buttons on both devices for 5 seconds.
      
      Q: How often should I update the firmware?
      A: We recommend checking for firmware updates at least once a month. Critical updates will be notified through our mobile app. Always update firmware before flying in new locations.
    `,
    displayHtml: `
      <div class="faq-demo">
        <h2>Frequently Asked Questions</h2>
        
        <div class="faq-section">
          <h3>Order & Shipping</h3>
          <div class="faq-item">
            <h4>How long does shipping take?</h4>
            <p>Domestic orders typically arrive within 2-5 business days. International shipping may take 7-14 business days.</p>
          </div>
          <div class="faq-item">
            <h4>Do you ship internationally?</h4>
            <p>Yes! We ship to over 50 countries worldwide.</p>
          </div>
        </div>
        
        <div class="faq-section">
          <h3>Returns & Refunds</h3>
          <div class="faq-item">
            <h4>What is your return policy?</h4>
            <p>We offer a 30-day return policy on most products. Items must be in their original packaging.</p>
          </div>
        </div>
      </div>
    `
  },
  checkout: {
    title: 'Checkout Page',
    content: `
      Checkout - Review Your Order
      
      Order Summary:
      - SkyScanner X3000 Premium Drone: $899.99
      - Extra Battery Pack: $129.99
      - 2-Year Extended Warranty: $149.99
      
      Subtotal: $1,179.97
      Shipping (2-Day Express): FREE
      Tax: $94.40
      
      Total: $1,274.37
      
      Payment Methods:
      - Credit/Debit Card
      - PayPal
      - Apple Pay
      - Store Credit
      
      Shipping Information:
      - Free 2-Day Shipping (Estimated delivery: May 15-16)
      - Express Overnight Shipping: +$25 (Get it tomorrow, May 14, if ordered within 3 hours)
      
      Return Policy Summary:
      30-day returns on unopened items in original packaging. 15% restocking fee applies to opened electronic items. See full policy for details.
    `,
    displayHtml: `
      <div class="checkout-demo">
        <h2>Checkout - Review Your Order</h2>
        
        <div class="order-summary">
          <h3>Order Summary</h3>
          <div class="order-item">
            <span>SkyScanner X3000 Premium Drone</span>
            <span>$899.99</span>
          </div>
          <div class="order-item">
            <span>Extra Battery Pack</span>
            <span>$129.99</span>
          </div>
          <div class="order-item">
            <span>2-Year Extended Warranty</span>
            <span>$149.99</span>
          </div>
          <div class="order-totals">
            <div class="subtotal">
              <span>Subtotal:</span>
              <span>$1,179.97</span>
            </div>
            <div class="shipping">
              <span>Shipping (2-Day Express):</span>
              <span>FREE</span>
            </div>
            <div class="tax">
              <span>Tax:</span>
              <span>$94.40</span>
            </div>
            <div class="grand-total">
              <span>Total:</span>
              <span>$1,274.37</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  account: {
    title: 'My Account Page',
    content: `
      My Account - User Profile
      
      User Information:
      Name: John Smith
      Email: john.smith@example.com
      Member Since: March 12, 2023
      Membership: Premium (Annual)
      Next Billing Date: March 12, 2026
      
      Subscription Benefits:
      - Free 2-Day Shipping on all orders
      - 15% discount on accessories
      - Priority customer support
      - Early access to new products
      - Free monthly drone maintenance check
      
      Order History:
      - Order #A12345 (May 1, 2023): Premium Plan - $299.99
      - Order #B67890 (May 5, 2023): Additional User License - $49.99
      
      Saved Payment Methods:
      - Visa ending in 4242 (expires 05/27)
      - PayPal account: j********@example.com
      
      Address Book:
      - Home: 123 Main Street, Apt 4B, New York, NY 10001
      - Work: 456 Business Ave, Suite 300, New York, NY 10022
      
      Communication Preferences:
      - Order confirmations: Enabled
      - Shipping updates: Enabled
      - Product announcements: Disabled
      - Promotions and offers: Enabled
    `,
    displayHtml: `
      <div class="account-demo">
        <h2>My Account - User Profile</h2>
        
        <div class="account-info">
          <h3>User Information</h3>
          <div class="info-item">
            <span>Name:</span>
            <span>John Smith</span>
          </div>
          <div class="info-item">
            <span>Email:</span>
            <span>john.smith@example.com</span>
          </div>
          <div class="info-item">
            <span>Membership:</span>
            <span>Premium (Annual)</span>
          </div>
        </div>
        
        <div class="order-history">
          <h3>Order History</h3>
          <div class="order">
            <div>Order #A12345 (May 1, 2023)</div>
            <div>Premium Plan - $299.99</div>
          </div>
          <div class="order">
            <div>Order #B67890 (May 5, 2023)</div>
            <div>Additional User License - $49.99</div>
          </div>
        </div>
      </div>
    `
  }
};