import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from '../components/ChatInterface';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data', err);
        if (err.response) {
          // Server responded with an error status
          setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
          // Request was made but no response received
          setError('Cannot connect to the server. The database might be down.');
        } else {
          // Something else happened
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
          <div className="text-red-600 font-semibold text-xl mb-4">Connection Error</div>
          <p className="text-gray-700">{error}</p>
          <p className="mt-4 text-gray-600 text-sm">
            Please check if MongoDB is running and properly configured on your server.
            The error suggests that the server cannot connect to MongoDB at localhost:27017.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {user && (
            <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
