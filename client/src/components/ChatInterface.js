import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
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
    <div className="flex flex-col h-full rounded-lg shadow-md border bg-white">
      <div className="bg-primary text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <FaRobot className="text-xl" />
          <h2 className="text-lg font-semibold">HelpMate AI Assistant</h2>
        </div>
      </div>

      <div className="p-4 flex-grow overflow-auto chat-container">
        {chatHistory.map((chat, index) => (
          <div 
            key={index}
            className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className="flex items-start max-w-[80%]">
              {chat.role === 'assistant' && (
                <div className="bg-primary rounded-full p-2 text-white mr-2">
                  <FaRobot />
                </div>
              )}
              
              <div className={`rounded-lg p-3 ${
                chat.role === 'user' 
                  ? 'bg-light text-dark' 
                  : 'bg-primary bg-opacity-10 text-dark'
              }`}>
                <p className="mb-1">{chat.content}</p>
                <p className="text-xs text-gray-500 text-right">
                  {formatTime(chat.timestamp)}
                </p>
              </div>
              
              {chat.role === 'user' && (
                <div className="bg-secondary rounded-full p-2 text-white ml-2">
                  <FaUser />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start">
              <div className="bg-primary rounded-full p-2 text-white mr-2">
                <FaRobot />
              </div>
              <div className="bg-primary bg-opacity-10 rounded-lg p-3 flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-primary text-white p-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
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
