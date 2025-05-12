import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheck, FaTimes, FaSpinner, FaCreditCard } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Get plan and payment cycle from query params
  const planFromQuery = queryParams.get('plan') || 'basic';
  const cycleFromQuery = queryParams.get('cycle') || 'monthly';

  const [plan, setPlan] = useState(planFromQuery);
  const [paymentCycle, setPaymentCycle] = useState(cycleFromQuery);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const plans = {
    basic: {
      name: 'Basic Plan',
      description: 'For small businesses',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      features: [
        '500 AI chat interactions per month',
        'Website chat widget',
        'Email support',
        'Basic analytics'
      ]
    },
    premium: {
      name: 'Premium Plan',
      description: 'For growing businesses',
      monthlyPrice: 2499,
      yearlyPrice: 24999,
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

  const selectedPlan = plans[plan] || plans.basic;
  const price = paymentCycle === 'monthly' 
    ? selectedPlan.monthlyPrice 
    : selectedPlan.yearlyPrice;

  const handlePayment = async () => {
    setProcessingPayment(true);

    try {
      // 1. Create an order on the server
      const orderRes = await axios.post('/api/subscription/order', {
        plan,
        paymentCycle
      });
      
      const { orderId, amount, currency } = orderRes.data.data;
      
      // 2. Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
        amount: amount,
        currency,
        name: "HelpMate AI",
        description: `${selectedPlan.name} - ${paymentCycle === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on the server
            const verifyRes = await axios.post('/api/subscription/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan,
              paymentCycle
            });
            
            toast.success('Payment successful! Your subscription is now active.');
            navigate('/subscription/success', { 
              state: { 
                plan, 
                paymentCycle,
                subscription: verifyRes.data.data.subscription
              }
            });
          } catch (err) {
            console.error('Payment verification failed:', err);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment initialization failed:', err);
      toast.error('Unable to initialize payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const startTrial = async () => {
    setLoading(true);
    
    try {
      const res = await axios.post('/api/subscription/trial');
      toast.success('Your 14-day free trial has started!');
      navigate('/subscription/success', { 
        state: { 
          plan: 'basic', 
          paymentCycle: 'monthly',
          subscription: res.data.data.subscription,
          isTrial: true
        }
      });
    } catch (err) {
      console.error('Failed to start trial:', err);
      toast.error(err.response?.data?.message || 'Failed to start free trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Subscription</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gray-50 p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{selectedPlan.name}</h2>
          <p className="text-gray-600">{selectedPlan.description}</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="mb-4 md:mb-0">
              <div className="text-sm text-gray-600 mb-1">Billing Cycle</div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setPaymentCycle('monthly')}
                  className={`px-4 py-2 text-sm rounded-full ${
                    paymentCycle === 'monthly'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPaymentCycle('yearly')}
                  className={`px-4 py-2 text-sm rounded-full flex items-center ${
                    paymentCycle === 'yearly'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Yearly <span className="ml-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Save 15%</span>
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-3xl font-bold text-gray-900">₹{price}</p>
              <p className="text-gray-500 text-sm">/{paymentCycle === 'monthly' ? 'month' : 'year'}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">What's included:</h3>
            <ul className="space-y-3">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-70"
            >
              {processingPayment ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCreditCard className="mr-2" />
                  Pay Now
                </>
              )}
            </button>
            
            <div className="text-center text-gray-500 text-sm">
              All prices include GST. You can cancel anytime.
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4 text-center">
              <p className="mb-2 text-gray-600">Not ready to commit?</p>
              <button 
                onClick={startTrial}
                disabled={loading}
                className="text-primary hover:underline font-medium flex items-center justify-center w-full"
              >
                {loading ? (
                  <><FaSpinner className="animate-spin mr-2" /> Starting trial...</>
                ) : (
                  <>Start your 14-day free trial instead</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FaCheck className="text-green-500 mr-2" />
          100% Secure Checkout
        </h3>
        <p className="text-gray-600 text-sm">
          Your payment is processed securely by Razorpay. We do not store your credit card information.
        </p>
      </div>
    </div>
  );
};

export default Checkout;