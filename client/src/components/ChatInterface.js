import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaMicrophone } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Load previous chat history if needed
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get('/api/chat/history');
        if (res.data.length > 0) {
          setChatHistory(res.data);
        } else {
          // Add a welcome message if no history
          setChatHistory([
            {
              role: 'assistant',
              content: 'Hello! I\'m HelpMate AI. How can I assist you today?',
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        toast.error('Failed to load chat history');
      }
    };

    fetchChatHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // Send message to backend
      const response = await axios.post('/api/chat/send', { message: message.trim() });
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to get response. Please try again later.');
      
      // Add error message to chat
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full rounded-lg shadow-lg border bg-gradient-to-b from-white to-gray-50">
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-full shadow-md">
            <FaRobot className="text-primary text-xl" />
          </div>
          <h2 className="text-lg font-semibold">HelpMate AI Assistant</h2>
        </div>
      </div>

      <div className="p-6 flex-grow overflow-auto chat-container bg-white bg-opacity-90">
        {chatHistory.map((chat, index) => (
          <div 
            key={index}
            className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} mb-5`}
          >
            <div className="flex items-start max-w-[80%]">
              {chat.role === 'assistant' && (
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-full p-2 text-white mr-3 shadow-md">
                  <FaRobot />
                </div>
              )}
              
              <div className={`rounded-2xl p-4 shadow-md ${
                chat.role === 'user' 
                  ? 'bg-gradient-to-r from-secondary to-indigo-500 text-white' 
                  : 'bg-gray-100 border border-gray-200 text-gray-800'
              }`}>
                <p className="mb-2 leading-relaxed">{chat.content}</p>
                <p className={`text-xs ${chat.role === 'user' ? 'text-gray-200' : 'text-gray-500'} text-right`}>
                  {formatTime(chat.timestamp)}
                </p>
              </div>
              
              {chat.role === 'user' && (
                <div className="bg-gradient-to-br from-secondary to-indigo-500 rounded-full p-2 text-white ml-3 shadow-md">
                  <FaUser />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start mb-5">
            <div className="flex items-start">
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-full p-2 text-white mr-3 shadow-md">
                <FaRobot />
              </div>
              <div className="bg-gray-100 rounded-2xl p-4 shadow-md flex space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2 items-center bg-gray-100 rounded-full px-4 py-2 shadow-inner">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow p-2 bg-transparent focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            className="text-gray-500 hover:text-primary p-2 rounded-full focus:outline-none transition-colors"
          >
            <FaMicrophone />
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-primary to-blue-600 text-white p-3 rounded-full hover:opacity-90 disabled:opacity-50 transition shadow-md"
            disabled={loading || message.trim() === ''}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;