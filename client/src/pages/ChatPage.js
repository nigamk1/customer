import React from 'react';
import ChatInterface from '../components/ChatInterface';

const ChatPage = () => {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white">
          <h1 className="text-2xl font-bold">HelpMate AI Chat</h1>
          <p className="text-sm opacity-90">
            Ask any question about our products, services, or support.
          </p>
        </div>
        
        <div className="h-[600px]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
