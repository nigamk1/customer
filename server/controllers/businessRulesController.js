const WebsiteIntegration = require('../models/WebsiteIntegration');

// @desc    Update business rules for an integration
// @route   PUT /api/rules/:integrationId
// @access  Private
exports.updateBusinessRules = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { 
      escalationThreshold, 
      escalationContacts,
      businessHours,
      triggerKeywords
    } = req.body;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Create business rules object if it doesn't exist
    if (!integration.businessRules) {
      integration.businessRules = {};
    }
    
    // Update escalation threshold
    if (escalationThreshold !== undefined) {
      // Validate threshold is between 0 and 1
      if (escalationThreshold < 0 || escalationThreshold > 1) {
        return res.status(400).json({ 
          message: 'Escalation threshold must be a value between 0 and 1' 
        });
      }
      
      integration.businessRules.escalationThreshold = escalationThreshold;
    }
    
    // Update escalation contacts
    if (escalationContacts) {
      // Validate at least one valid contact
      const validContacts = escalationContacts.filter(contact => 
        contact.name && (contact.email || 
          (contact.notificationChannel === 'webhook' && contact.webhookUrl))
      );
      
      if (validContacts.length === 0 && escalationContacts.length > 0) {
        return res.status(400).json({ 
          message: 'At least one valid escalation contact is required' 
        });
      }
      
      integration.businessRules.escalationContacts = validContacts;
    }
    
    // Update business hours
    if (businessHours) {
      // Validate business hours schedule if enabled
      if (businessHours.enabled && businessHours.schedule) {
        // Check for valid schedule format
        const validSchedule = businessHours.schedule.every(slot => 
          ['monday', 'tuesday', 'wednesday', 'thursday', 
            'friday', 'saturday', 'sunday'].includes(slot.day) &&
          slot.open && slot.close
        );
        
        if (!validSchedule) {
          return res.status(400).json({ 
            message: 'Invalid business hours schedule format' 
          });
        }
      }
      
      integration.businessRules.businessHours = {
        ...integration.businessRules.businessHours,
        ...businessHours
      };
    }
    
    // Update trigger keywords
    if (triggerKeywords) {
      integration.businessRules.triggerKeywords = triggerKeywords;
    }
    
    await integration.save();
    
    res.json({
      message: 'Business rules updated successfully',
      businessRules: integration.businessRules
    });
    
  } catch (err) {
    console.error('Business rules update error:', err);
    res.status(500).json({ 
      message: 'Error updating business rules', 
      error: err.message
    });
  }
};

// @desc    Get business rules for an integration
// @route   GET /api/rules/:integrationId
// @access  Private
exports.getBusinessRules = async (req, res) => {
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
    
    res.json(integration.businessRules || {});
    
  } catch (err) {
    console.error('Error retrieving business rules:', err);
    res.status(500).json({ 
      message: 'Error retrieving business rules', 
      error: err.message
    });
  }
};
