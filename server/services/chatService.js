const { searchVectorDb } = require('../services/vectorDb');
const { getAvailableToolSchemas, executeToolCall } = require('../services/toolService');
const KnowledgeBase = require('../models/KnowledgeBase');

/**
 * Build context from knowledge base using vector similarity search
 * 
 * @param {Object} integration - The integration object
 * @param {string} query - The user's query
 * @returns {Promise<string>} - Relevant context for the query
 */
async function buildContextFromVectorSearch(integration, query) {
  try {
    // Check if vector search is enabled
    if (!integration.knowledgeBase || 
        !integration.knowledgeBase.enabled || 
        !integration.knowledgeBase.vectorSearch || 
        !integration.knowledgeBase.vectorSearch.enabled) {
      return null;
    }
    
    // Search the vector database for relevant content
    const searchResults = await searchVectorDb(
      integration._id.toString(), 
      query, 
      5  // Get top 5 results
    );
    
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    
    // Format the context
    let context = 'RELEVANT INFORMATION FROM KNOWLEDGE BASE:\n\n';
    
    for (const result of searchResults) {
      const metadata = result.metadata;
      context += `Source: ${metadata.title || metadata.url || 'Document'}\n`;
      context += `Content: ${metadata.text}\n\n`;
    }
    
    return context;
  } catch (error) {
    console.error('Error building context from vector search:', error);
    return null;
  }
}

/**
 * Check if a message contains trigger keywords
 * 
 * @param {string} message - The message to check
 * @param {Array} triggerKeywords - List of trigger keyword objects
 * @returns {Object|null} - Matched trigger or null
 */
function checkForTriggerKeywords(message, triggerKeywords) {
  if (!triggerKeywords || !triggerKeywords.length) {
    return null;
  }
  
  const lowerMessage = message.toLowerCase();
  
  for (const trigger of triggerKeywords) {
    if (lowerMessage.includes(trigger.keyword.toLowerCase())) {
      return trigger;
    }
  }
  
  return null;
}

/**
 * Check if current time is within business hours
 * 
 * @param {Object} businessHours - Business hours configuration
 * @returns {boolean} - True if within business hours
 */
function isWithinBusinessHours(businessHours) {
  // If business hours not enabled, always return true
  if (!businessHours || !businessHours.enabled) {
    return true;
  }
  
  const now = new Date();
  
  // Convert to the configured timezone
  const options = { timeZone: businessHours.timezone || 'UTC' };
  const localTime = now.toLocaleString('en-US', options);
  const localDate = new Date(localTime);
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[localDate.getDay()];
  
  // Find today's schedule
  const todaySchedule = businessHours.schedule.find(s => s.day === today);
  
  // If no schedule for today, business is closed
  if (!todaySchedule) {
    return false;
  }
  
  // Parse hours
  const currentHour = localDate.getHours() + (localDate.getMinutes() / 60);
  
  const [openHour, openMinute] = todaySchedule.open.split(':').map(Number);
  const openTime = openHour + (openMinute / 60);
  
  const [closeHour, closeMinute] = todaySchedule.close.split(':').map(Number);
  const closeTime = closeHour + (closeMinute / 60);
  
  // Check if current time is within business hours
  return currentHour >= openTime && currentHour < closeTime;
}

/**
 * Process function calls from OpenAI
 * 
 * @param {Object} integration - The integration configuration
 * @param {Array} toolCalls - Tool calls from OpenAI response
 * @returns {Promise<Array>} - Results of tool calls
 */
async function processToolCalls(integration, toolCalls) {
  const results = [];
  
  for (const toolCall of toolCalls) {
    try {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      // Execute the function call
      const result = await executeToolCall(
        integration,
        functionName,
        functionArgs
      );
      
      results.push({
        toolCallId: toolCall.id,
        role: 'tool',
        name: functionName,
        content: JSON.stringify(result)
      });
    } catch (error) {
      console.error(`Error executing tool call ${toolCall.function.name}:`, error);
      
      // Add error result
      results.push({
        toolCallId: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({ error: error.message })
      });
    }
  }
  
  return results;
}

module.exports = {
  buildContextFromVectorSearch,
  checkForTriggerKeywords,
  isWithinBusinessHours,
  processToolCalls
};
