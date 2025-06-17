import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ChatInterface from '../components/ChatInterface';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/user');
        setUser(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data', err);
        try {
          // Try to get health status to determine the issue
          const healthCheck = await axios.get('/api/health/status');
          
          if (healthCheck.data.services.mongodb !== 'Connected') {
            setError('Database connection issue: The server cannot connect to the database. Please try again later.');
          } else if (err.response) {
            // Server responded with an error status
            setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
          } else if (err.request) {
            // Request was made but no response received
            setError('Cannot connect to the server. The server might be down or restarting.');
          } else {
            // Something else happened
            setError(`Error: ${err.message}`);
          }
        } catch (healthErr) {
          // Can't even reach the health check endpoint
          setError('Server connection failed. The server might be down or experiencing issues.');
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
          <p className="text-gray-700">{error}</p>          <p className="mt-4 text-gray-600 text-sm">
            We're experiencing connection issues. This could be due to:
            <ul className="list-disc ml-5 mt-2">
              <li>Database connectivity problems</li>
              <li>Server is restarting or under maintenance</li>
              <li>Network connectivity issues</li>
            </ul>
          </p>
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Retry Connection
            </button>
            <button
              onClick={async () => {
                try {
                  await axios.get('/api/health/db-diagnose');
                  toast.success('Diagnostic check initiated');
                } catch (err) {
                  console.error('Diagnostic failed', err);
                }
                setTimeout(() => window.location.reload(), 2000);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
            >
              Run Diagnostics
            </button>
          </div>
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
