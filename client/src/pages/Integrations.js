import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaSpinner, FaTrash, FaEdit, FaCode, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Integrations = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchIntegrations = async () => {
      try {
        const res = await axios.get('/api/integration');
        setIntegrations(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching integrations:', err);
        setError('Failed to load your website integrations');
        toast.error('Failed to load your website integrations');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, [isAuthenticated]);

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`/api/integration/${id}`, {
        active: !currentStatus
      });
      
      // Update local state
      setIntegrations(integrations.map(integration => 
        integration._id === id ? { ...integration, active: !currentStatus } : integration
      ));
      
      toast.success(`Integration ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update integration status');
    }
  };

  const deleteIntegration = async (id) => {
    if (!window.confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/integration/${id}`);
      
      // Remove from local state
      setIntegrations(integrations.filter(integration => integration._id !== id));
      
      toast.success('Integration deleted successfully');
    } catch (err) {
      console.error('Error deleting integration:', err);
      toast.error('Failed to delete integration');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Website Integrations</h1>
        <Link
          to="/integrations/new"
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Integration
        </Link>
      </div>

      {integrations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Integrations Yet</h2>
          <p className="text-gray-600 mb-6">
            Start adding your website integrations to enable AI chat support on your sites.
          </p>
          <Link
            to="/integrations/new"
            className="bg-primary text-white px-6 py-3 rounded-lg inline-flex items-center"
          >
            <FaPlus className="mr-2" /> Create Your First Integration
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration._id}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{integration.name}</h3>
                  <button
                    onClick={() => toggleStatus(integration._id, integration.active)}
                    className={`${
                      integration.active
                        ? 'text-green-500 hover:text-green-700'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={integration.active ? 'Active' : 'Inactive'}
                  >
                    {integration.active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{integration.domain}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between">
                    <Link
                      to={`/integrations/${integration._id}`}
                      className="text-primary hover:underline flex items-center"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </Link>
                    <Link
                      to={`/integrations/${integration._id}/widget-code`}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <FaCode className="mr-1" /> Get Code
                    </Link>
                    <button
                      onClick={() => deleteIntegration(integration._id)}
                      className="text-red-500 hover:underline flex items-center"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Integrations;