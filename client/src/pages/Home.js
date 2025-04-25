import React from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaChartLine, FaUsers, FaLock } from 'react-icons/fa';
import ChatInterface from '../components/ChatInterface';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Customer Support, Powered by AI
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            HelpMate AI provides instant answers to customer questions, 24/7 support, and seamless escalation to human agents when needed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/chat"
              className="bg-white text-primary font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Try It Now
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary transition duration-300"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose HelpMate AI?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary inline-block p-4 rounded-full text-white mb-6">
                <FaRobot className="text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Responses</h3>
              <p className="text-gray-600">
                Our AI assistant provides instant, accurate answers to common customer questions.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary inline-block p-4 rounded-full text-white mb-6">
                <FaUsers className="text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Human Backup</h3>
              <p className="text-gray-600">
                Seamless escalation to human agents when conversations require a personal touch.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary inline-block p-4 rounded-full text-white mb-6">
                <FaChartLine className="text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Detailed Analytics</h3>
              <p className="text-gray-600">
                Track customer satisfaction, common issues, and support team performance.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary inline-block p-4 rounded-full text-white mb-6">
                <FaLock className="text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
              <p className="text-gray-600">
                Your customer data is encrypted and handled with the highest security standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10">
              <h2 className="text-3xl font-bold mb-6">Try HelpMate AI Now</h2>
              <p className="text-gray-600 text-lg mb-6">
                See how our AI can handle customer queries in real-time. Ask anything about products, services, or support.
              </p>
              <p className="text-gray-600 mb-8">
                This is just a demo. Sign up for a free account to access all features including custom training, human agent integration, and analytics.
              </p>
              <Link
                to="/register"
                className="bg-primary text-white font-semibold py-3 px-8 rounded-lg hover:bg-opacity-90 transition duration-300 inline-block"
              >
                Create Free Account
              </Link>
            </div>
            
            <div className="lg:w-1/2 w-full max-w-md mx-auto">
              <ChatInterface />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
