import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaTag, FaRegClock } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Pricing = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const plans = {
    basic: {
      name: 'Basic Plan',
      monthlyPrice: 999,
      yearlyPrice: 10190, // ₹999 × 12 - 15%
      features: [
        'Up to 1,000 chats/month',
        'AI-powered responses',
        'Basic analytics',
        'Email support'
      ],
      notIncluded: [
        'Unlimited chats',
        'Website integration',
        'Custom training',
        'Priority support'
      ]
    },
    premium: {
      name: 'Premium Plan',
      monthlyPrice: 2499,
      yearlyPrice: 25499, // ₹2,499 × 12 - 15%
      features: [
        'Unlimited chats',
        'AI-powered responses',
        'Advanced analytics',
        'Priority support',
        'Website integration',
        'Custom training'
      ],
      notIncluded: []
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCycleChange = (newCycle) => {
    setCycle(newCycle);
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      // Save selected plan and redirect to login
      localStorage.setItem('selectedPlan', plan);
      localStorage.setItem('selectedCycle', cycle);
      navigate('/register?redirect=checkout');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/subscription/create-order', {
        plan,
        cycle
      });

      // Save order info for checkout page
      localStorage.setItem('orderData', JSON.stringify({
        orderId: res.data.order.id,
        amount: res.data.order.amount,
        plan,
        cycle,
        planDetails: res.data.planDetails
      }));

      navigate('/checkout');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription order');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      navigate('/register?redirect=trial');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/subscription/start-trial');
      toast.success(res.data.message);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error(error.response?.data?.message || 'Failed to start free trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI Chatbot Support for Your Business – Try for Free!
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-full p-1 shadow-md inline-flex">
            <button
              className={`px-6 py-2 rounded-full font-medium ${
                cycle === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => handleCycleChange('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-full font-medium flex items-center ${
                cycle === 'yearly'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => handleCycleChange('yearly')}
            >
              <span>Yearly</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                <FaTag className="mr-1" />
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Trial banner */}
        <div className="max-w-5xl mx-auto mb-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-10 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <FaRegClock className="text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Start with a 14-day Free Trial</h2>
            <p className="mb-6 text-blue-100">
              Get full access to our Basic plan features. No credit card required.
            </p>
            <button
              onClick={handleStartTrial}
              disabled={loading}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([planId, plan]) => (
            <div
              key={planId}
              className={`bg-white rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 ${
                selectedPlan === planId ? 'scale-105 ring-2 ring-primary' : 'hover:shadow-xl'
              }`}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">
                    ₹{cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="ml-2 text-gray-500">
                    /{cycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <button
                  onClick={() => handleSubscribe(planId)}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold ${
                    planId === 'premium'
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-blue-100 hover:bg-blue-200 text-primary'
                  } transition-colors mb-8`}
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Included features:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <>
                      <h4 className="font-semibold text-gray-700 mt-6 mb-3">Not included:</h4>
                      <ul className="space-y-3 text-gray-500">
                        {plan.notIncluded.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <FaTimes className="text-red-400 mt-1 mr-3 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-semibold mb-4">Need a custom solution?</h3>
          <p className="text-gray-600 mb-6">
            Contact us for custom pricing tailored to your business needs
          </p>
          <Link
            to="/contact"
            className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;