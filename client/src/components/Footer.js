import React from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaTwitter, FaFacebook, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FaRobot className="text-primary text-2xl" />
              <span className="text-xl font-bold">HelpMate AI</span>
            </div>
            <p className="text-sm text-gray-300">
              AI-powered customer service assistant that helps businesses provide instant support.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-primary">Home</Link></li>
              <li><Link to="/chat" className="text-gray-300 hover:text-primary">Chat</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-primary">Login</Link></li>
              <li><Link to="/register" className="text-gray-300 hover:text-primary">Register</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-300 hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary">
                <FaTwitter size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary">
                <FaFacebook size={24} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary">
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300 text-sm">
          &copy; {new Date().getFullYear()} HelpMate AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
