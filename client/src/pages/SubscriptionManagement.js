import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCreditCard, FaCalendarAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatDistance } from 'date-fns';

const SubscriptionManagement = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await axios.get('/api/subscription');
        setSubscription(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Unable to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleCancelSubscription = async () => {
    // Confirm cancellation
    if (!window.confirm('Are you sure you want to cancel your subscription? You can continue using the service until the end of your current billing period.')) {
      return;
    }

    try {
      setCancelLoading(true);
      const res = await axios.post('/api/subscription/cancel');
      setSubscription(res.data);
      toast.success('Subscription cancelled successfully');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">No Active Subscription</h1>
            <p className="text-gray-600 mb-8">
              You don't have an active subscription. Choose a plan to get started with HelpMate AI.
            </p>
            <Link
              to="/pricing"
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data, planDetails } = subscription;
  const isActive = data.status === 'active' || data.status === 'trial';
  const isTrial = data.status === 'trial';
  const isCancelled = data.status === 'cancelled';
  const endDate = new Date(data.endDate);
  const formattedEndDate = endDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeRemaining = formatDistance(endDate, new Date(), { addSuffix: true });

  const getBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Subscription</h1>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap justify-between items-start mb-8">
                <div>
                  <div className="flex items-center mb-2">
                    <h2 className="text-2xl font-bold mr-3">{planDetails.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(data.status)}`}>
                      {data.status === 'active' ? 'Active' : 
                       data.status === 'trial' ? 'Trial' : 
                       data.status === 'cancelled' ? 'Cancelled' : 
                       data.status === 'past_due' ? 'Past Due' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {data.paymentCycle === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                    {isCancelled && ' (Cancelled)'}
                  </p>
                </div>

                {!isTrial && !isCancelled && (
                  <Link
                    to="/pricing"
                    className="flex items-center text-primary hover:underline mt-2 md:mt-0"
                  >
                    Change Plan <FaArrowRight className="ml-2" />
                  </Link>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FaClock className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Subscription Status</h3>
                  </div>

                  {isTrial ? (
                    <>
                      <p className="text-gray-600 mb-2">
                        Your trial ends {timeRemaining}
                      </p>
                      <p className="text-gray-600">
                        After your trial period ends on {formattedEndDate}, you'll need to choose a subscription plan to continue using HelpMate AI.
                      </p>
                    </>
                  ) : isCancelled ? (
                    <>
                      <p className="text-gray-600 mb-2">
                        Your subscription has been cancelled but remains active until {formattedEndDate} ({timeRemaining})
                      </p>
                      <p className="text-gray-600">
                        You can continue using HelpMate AI until the end of your billing period.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">
                        Your subscription renews {timeRemaining}
                      </p>
                      <p className="text-gray-600">
                        Next billing date: {formattedEndDate}
                      </p>
                    </>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FaCreditCard className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Plan Details</h3>
                  </div>

                  <div className="space-y-2">
                    {data.plan === 'basic' ? (
                      <>
                        <p className="flex justify-between">
                          <span className="text-gray-600">Chat Limit:</span>
                          <span className="font-medium">{data.chatsUsed} / {data.chatLimit}</span>
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (data.chatsUsed / data.chatLimit) * 100)}%` }}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <p className="flex justify-between">
                        <span className="text-gray-600">Chat Limit:</span>
                        <span className="font-medium">Unlimited</span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">
                        ₹{data.paymentCycle === 'monthly' ? planDetails.monthlyPrice / 100 : planDetails.yearlyPrice / 100}/{data.paymentCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {isActive && !isTrial && !isCancelled && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Your subscription will remain active until the end of your current billing period.
                  </p>
                </div>
              )}

              {isTrial && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaCalendarAlt className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Trial Period Active</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          You're currently on a free trial which expires {timeRemaining}. Choose a subscription plan before {formattedEndDate} to continue using HelpMate AI without interruption.
                        </p>
                        <Link
                          to="/pricing"
                          className="block mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded"
                        >
                          Choose a Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="border-t border-gray-200 pt-6 mt-6 text-center">
                  <p className="mb-4 text-gray-600">
                    Want to continue using HelpMate AI after your current period?
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    Renew Subscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;