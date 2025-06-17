const WebsiteIntegration = require('../models/WebsiteIntegration');
const { toolDefinitions, executeToolCall } = require('../services/toolService');

// @desc    Configure a tool for an integration
// @route   POST /api/tools/configure
// @access  Private
exports.configureTool = async (req, res) => {
  try {
    const { integrationId, toolName, endpoint, method, apiKey, headers } = req.body;
    
    // Validate request
    if (!integrationId || !toolName || !endpoint) {
      return res.status(400).json({ 
        message: 'Integration ID, tool name, and endpoint are required' 
      });
    }
    
    // Check if tool exists in definitions
    if (!toolDefinitions[toolName]) {
      return res.status(400).json({ message: 'Invalid tool name' });
    }
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Initialize tools config if it doesn't exist
    if (!integration.toolsConfig) {
      integration.toolsConfig = {};
    }
    
    // Update or create tool configuration
    integration.toolsConfig[toolName] = {
      endpoint,
      method: method || 'GET',
      apiKey: apiKey || integration.apiKey,
      headers: headers || {}
    };
    
    await integration.save();
    
    res.json({
      message: `Tool ${toolName} configured successfully`,
      toolName
    });
    
  } catch (err) {
    console.error('Tool configuration error:', err);
    res.status(500).json({ 
      message: 'Error configuring tool', 
      error: err.message
    });
  }
};

// @desc    Get all available tools
// @route   GET /api/tools/available
// @access  Private
exports.getAvailableTools = async (req, res) => {
  try {
    // Return all tool definitions
    const tools = Object.entries(toolDefinitions).map(([name, def]) => ({
      name,
      description: def.description,
      parameters: def.parameters
    }));
    
    res.json(tools);
    
  } catch (err) {
    console.error('Error retrieving available tools:', err);
    res.status(500).json({ 
      message: 'Error retrieving available tools', 
      error: err.message
    });
  }
};

// @desc    Get configured tools for an integration
// @route   GET /api/tools/configured/:integrationId
// @access  Private
exports.getConfiguredTools = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Get configured tools
    const configuredTools = integration.toolsConfig || {};
    
    // Format response
    const tools = Object.entries(configuredTools).map(([name, config]) => ({
      name,
      endpoint: config.endpoint,
      method: config.method || 'GET',
      // Don't return API key for security
      hasApiKey: !!config.apiKey,
      description: toolDefinitions[name]?.description || 'Custom tool'
    }));
    
    res.json(tools);
    
  } catch (err) {
    console.error('Error retrieving configured tools:', err);
    res.status(500).json({ 
      message: 'Error retrieving configured tools', 
      error: err.message
    });
  }
};

// @desc    Remove a configured tool
// @route   DELETE /api/tools/:integrationId/:toolName
// @access  Private
exports.removeTool = async (req, res) => {
  try {
    const { integrationId, toolName } = req.params;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Check if tool is configured
    if (!integration.toolsConfig || !integration.toolsConfig[toolName]) {
      return res.status(404).json({ message: 'Tool not configured' });
    }
    
    // Remove tool configuration
    delete integration.toolsConfig[toolName];
    await integration.save();
    
    res.json({
      message: `Tool ${toolName} removed successfully`
    });
    
  } catch (err) {
    console.error('Tool removal error:', err);
    res.status(500).json({ 
      message: 'Error removing tool', 
      error: err.message
    });
  }
};

// @desc    Test a tool configuration
// @route   POST /api/tools/test
// @access  Private
exports.testTool = async (req, res) => {
  try {
    const { integrationId, toolName, parameters } = req.body;
    
    // Validate request
    if (!integrationId || !toolName) {
      return res.status(400).json({ 
        message: 'Integration ID and tool name are required' 
      });
    }
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Check if tool is configured
    if (!integration.toolsConfig || !integration.toolsConfig[toolName]) {
      return res.status(404).json({ message: 'Tool not configured' });
    }
    
    // Execute the tool call
    const result = await executeToolCall(
      integration, 
      toolName, 
      parameters || {}
    );
    
    res.json({
      message: 'Tool test completed',
      result
    });
    
  } catch (err) {
    console.error('Tool test error:', err);
    res.status(500).json({ 
      message: 'Error testing tool', 
      error: err.message
    });
  }
};
