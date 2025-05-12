import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaRocket, FaChartLine, FaComments } from 'react-icons/fa';

const SubscriptionSuccess = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <FaCheckCircle className="text-green-500 text-5xl" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Thank You for Subscribing!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your subscription has been activated successfully.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaRocket className="text-primary text-xl" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                <p className="text-gray-600 text-sm">
                  Set up your AI chatbot and start engaging with your customers
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaComments className="text-primary text-xl" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Train Your AI</h3>
                <p className="text-gray-600 text-sm">
                  Customize responses to match your brand and knowledge base
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaChartLine className="text-primary text-xl" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Monitor Results</h3>
                <p className="text-gray-600 text-sm">
                  Track performance and customer satisfaction metrics
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/dashboard"
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/integrations/new"
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Set Up Website Integration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;