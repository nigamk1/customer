const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { addDays, addMonths, addYears } = require('date-fns');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Subscription plans
const PLANS = {
  basic: {
    monthlyPrice: 99900, // ₹999 in paise (Razorpay uses smallest currency unit)
    yearlyPrice: 999900, // ₹9,999 in paise (15% discount for yearly)
    name: 'Basic Plan',
    description: 'For small businesses',
    chatLimit: 500,
    features: [
      '500 AI chat interactions per month',
      'Website chat widget',
      'Email support',
      'Basic analytics'
    ]
  },
  premium: {
    monthlyPrice: 249900, // ₹2,499 in paise
    yearlyPrice: 2499900, // ₹24,999 in paise (15% discount for yearly)
    name: 'Premium Plan',
    description: 'For growing businesses',
    chatLimit: null, // unlimited
    features: [
      'Unlimited AI chat interactions',
      'Advanced widget customization',
      'Knowledge base integration',
      'Priority support',
      'Advanced analytics and reporting',
      'Multiple website integrations'
    ]
  }
};

// @desc    Create a new subscription
// @route   POST /api/subscription
// @access  Private
exports.createSubscription = async (req, res) => {
  try {
    const { plan, paymentId, subscriptionId } = req.body;

    // Validate plan
    if (!PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get existing subscription if any
    let subscription = await Subscription.findOne({ user: req.user.id });
    
    if (subscription && subscription.status === 'active') {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }

    // Create or update subscription
    if (!subscription) {
      subscription = new Subscription({
        user: req.user.id,
        plan,
        paymentCycle: req.body.paymentCycle || 'monthly',
        planDetails: PLANS[plan],
        paymentId,
        subscriptionId,
        status: 'active',
        startDate: new Date(),
        endDate: calculateEndDate(req.body.paymentCycle || 'monthly'),
        chatLimit: PLANS[plan].chatLimit,
        chatsUsed: 0
      });
    } else {
      // Update existing subscription
      subscription.plan = plan;
      subscription.paymentCycle = req.body.paymentCycle || 'monthly';
      subscription.planDetails = PLANS[plan];
      subscription.paymentId = paymentId;
      subscription.subscriptionId = subscriptionId;
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = calculateEndDate(req.body.paymentCycle || 'monthly');
      subscription.chatLimit = PLANS[plan].chatLimit;
      subscription.chatsUsed = 0;
    }

    await subscription.save();

    // Update user subscription status
    user.isSubscribed = true;
    user.subscriptionPlan = plan;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ message: 'Error creating subscription' });
  }
};

// @desc    Get current subscription details
// @route   GET /api/subscription
// @access  Private
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Get plan details based on current subscription
    const planDetails = PLANS[subscription.plan];

    res.json({
      success: true,
      data: subscription,
      planDetails
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Error retrieving subscription' });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return res.status(400).json({ message: 'Subscription is not active' });
    }

    // If using Razorpay recurring payments, cancel at Razorpay as well
    if (subscription.subscriptionId) {
      try {
        await razorpay.subscriptions.cancel(subscription.subscriptionId);
      } catch (error) {
        console.error('Razorpay cancellation error:', error);
        // Continue even if Razorpay cancellation fails
      }
    }

    // Mark as cancelled but keep access until end date
    subscription.status = 'cancelled';
    await subscription.save();

    // Update user model
    const user = await User.findById(req.user.id);
    if (user) {
      user.isSubscribed = false;
      await user.save();
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
};

// @desc    Create a Razorpay order
// @route   POST /api/subscription/order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { plan, paymentCycle } = req.body;
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }
    
    if (!paymentCycle || !['monthly', 'yearly'].includes(paymentCycle)) {
      return res.status(400).json({ message: 'Invalid payment cycle' });
    }
    
    // Get price based on plan and payment cycle
    const amount = paymentCycle === 'monthly' 
      ? PLANS[plan].monthlyPrice 
      : PLANS[plan].yearlyPrice;
    
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `subscription_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        plan: plan,
        paymentCycle: paymentCycle
      }
    });
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: PLANS[plan],
        paymentCycle
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Error creating payment order' });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/subscription/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan, paymentCycle } = req.body;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }
    
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    const isSignatureValid = generatedSignature === razorpay_signature;
    
    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    
    // Create or update subscription
    const subscription = await Subscription.findOne({ user: req.user.id }) || new Subscription({ user: req.user.id });
    
    subscription.plan = plan;
    subscription.paymentCycle = paymentCycle;
    subscription.planDetails = PLANS[plan];
    subscription.paymentId = razorpay_payment_id;
    subscription.status = 'active';
    subscription.startDate = new Date();
    subscription.endDate = calculateEndDate(paymentCycle);
    subscription.chatLimit = PLANS[plan].chatLimit;
    subscription.chatsUsed = 0;
    
    await subscription.save();
    
    // Update user
    const user = await User.findById(req.user.id);
    user.isSubscribed = true;
    user.subscriptionPlan = plan;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        subscription
      },
      message: 'Payment verified and subscription activated'
    });
    
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

// @desc    Start free trial
// @route   POST /api/subscription/trial
// @access  Private
exports.startTrial = async (req, res) => {
  try {
    // Check if user already has a subscription or had a trial
    const existingSubscription = await Subscription.findOne({ user: req.user.id });
    
    if (existingSubscription && existingSubscription.hadTrial) {
      return res.status(400).json({ message: 'You have already used your free trial' });
    }
    
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }
    
    // Create trial subscription (14 days)
    const trialEndDate = addDays(new Date(), 14);
    
    // Use the basic plan features for trial
    const subscription = existingSubscription || new Subscription({ user: req.user.id });
    
    subscription.plan = 'basic';
    subscription.paymentCycle = 'monthly'; // Default to monthly for trial
    subscription.planDetails = PLANS.basic;
    subscription.status = 'trial';
    subscription.startDate = new Date();
    subscription.endDate = trialEndDate;
    subscription.chatLimit = PLANS.basic.chatLimit;
    subscription.chatsUsed = 0;
    subscription.hadTrial = true;
    
    await subscription.save();
    
    // Update user
    const user = await User.findById(req.user.id);
    user.isSubscribed = true;
    user.subscriptionPlan = 'basic';
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        subscription
      },
      message: 'Free trial started successfully'
    });
    
  } catch (err) {
    console.error('Start trial error:', err);
    res.status(500).json({ message: 'Error starting free trial' });
  }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/subscription/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    
    if (!webhookSignature) {
      return res.status(400).json({ message: 'Missing webhook signature' });
    }
    
    const payload = JSON.stringify(req.body);
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    if (generatedSignature !== webhookSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
    
    const event = req.body.event;
    
    // Handle different webhook events
    if (event === 'payment.captured') {
      // Payment successful - handled through regular flow
      console.log('Payment captured webhook received');
    }
    else if (event === 'payment.failed') {
      const paymentId = req.body.payload.payment.entity.id;
      const subscription = await Subscription.findOne({ paymentId });
      
      if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
      }
    }
    else if (event === 'subscription.cancelled') {
      const subscriptionId = req.body.payload.subscription.entity.id;
      const subscription = await Subscription.findOne({ subscriptionId });
      
      if (subscription) {
        subscription.status = 'cancelled';
        await subscription.save();
        
        // Update user
        const user = await User.findById(subscription.user);
        if (user) {
          user.isSubscribed = false;
          await user.save();
        }
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ message: 'Error processing webhook' });
  }
};

// Helper function to calculate subscription end date
function calculateEndDate(paymentCycle) {
  const now = new Date();
  if (paymentCycle === 'monthly') {
    return addMonths(now, 1);
  } else if (paymentCycle === 'yearly') {
    return addYears(now, 1);
  } else {
    // Default to monthly
    return addMonths(now, 1);
  }
}