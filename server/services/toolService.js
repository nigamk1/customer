const axios = require('axios');

/**
 * Definition of available tools for the AI to use
 * This is a registry of all tools that can be used by the AI
 */
const toolDefinitions = {
  // Customer information lookup
  get_customer_info: {
    description: "Get information about a customer by email or ID",
    parameters: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Customer email or ID"
        }
      },
      required: ["identifier"]
    }
  },
  
  // Order tracking
  track_order: {
    description: "Track the status of an order",
    parameters: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "Order ID to track"
        }
      },
      required: ["order_id"]
    }
  },
  
  // Subscription management
  manage_subscription: {
    description: "Get or modify customer subscription",
    parameters: {
      type: "object",
      properties: {
        customer_id: {
          type: "string",
          description: "Customer ID"
        },
        action: {
          type: "string",
          enum: ["view", "cancel", "upgrade", "downgrade"],
          description: "Action to perform on subscription"
        },
        plan_id: {
          type: "string",
          description: "New plan ID (only for upgrade/downgrade)"
        }
      },
      required: ["customer_id", "action"]
    }
  },
  
  // Create support ticket
  create_ticket: {
    description: "Create a new support ticket",
    parameters: {
      type: "object",
      properties: {
        customer_email: {
          type: "string",
          description: "Customer email"
        },
        subject: {
          type: "string",
          description: "Ticket subject"
        },
        description: {
          type: "string",
          description: "Detailed description of the issue"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Ticket priority"
        }
      },
      required: ["customer_email", "subject", "description"]
    }
  },
  
  // Schedule appointment
  schedule_appointment: {
    description: "Schedule an appointment or consultation",
    parameters: {
      type: "object",
      properties: {
        customer_email: {
          type: "string",
          description: "Customer email"
        },
        service_type: {
          type: "string",
          description: "Type of service for the appointment"
        },
        preferred_date: {
          type: "string",
          description: "Preferred date in YYYY-MM-DD format"
        },
        preferred_time: {
          type: "string",
          description: "Preferred time in 24-hour format (HH:MM)"
        }
      },
      required: ["customer_email", "service_type", "preferred_date"]
    }
  }
};

/**
 * Execute a tool call with the given integration configuration
 * 
 * @param {Object} integration - Integration configuration with API endpoints and auth
 * @param {string} toolName - Name of the tool to call
 * @param {Object} parameters - Parameters for the tool call
 * @returns {Promise<Object>} - Tool execution result
 */
async function executeToolCall(integration, toolName, parameters) {
  if (!integration.toolsConfig || !integration.toolsConfig[toolName]) {
    throw new Error(`Tool ${toolName} not configured for this integration`);
  }
  
  const toolConfig = integration.toolsConfig[toolName];
  
  try {
    // Make API call to the customer's endpoint
    const response = await axios({
      method: toolConfig.method || 'GET',
      url: toolConfig.endpoint,
      headers: {
        ...toolConfig.headers,
        'Authorization': `Bearer ${toolConfig.apiKey}`
      },
      data: parameters
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Tool execution successful'
    };
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error.message);
    
    return {
      success: false,
      error: error.message,
      message: 'Tool execution failed'
    };
  }
}

/**
 * Get available tool schemas based on the integration configuration
 * 
 * @param {Object} integration - Integration with tool config
 * @returns {Array} - Available tool definitions for OpenAI
 */
function getAvailableToolSchemas(integration) {
  if (!integration.toolsConfig) {
    return [];
  }
  
  // Only return tools that are configured for this integration
  const availableTools = Object.keys(integration.toolsConfig)
    .filter(toolName => toolDefinitions[toolName])
    .map(toolName => ({
      type: "function",
      function: {
        name: toolName,
        description: toolDefinitions[toolName].description,
        parameters: toolDefinitions[toolName].parameters
      }
    }));
  
  return availableTools;
}

module.exports = {
  toolDefinitions,
  executeToolCall,
  getAvailableToolSchemas
};
