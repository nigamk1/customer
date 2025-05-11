import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner, FaArrowLeft, FaCopy, FaKey, FaRedo } from 'react-icons/fa';

const IntegrationWidgetCode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const codeRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [integration, setIntegration] = useState(null);
  const [widgetCode, setWidgetCode] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch integration data
        const integrationRes = await axios.get(`/api/integration/${id}`);
        setIntegration(integrationRes.data.data);
        
        // Fetch widget code
        const widgetCodeRes = await axios.get(`/api/integration/${id}/widget-code`);
        setWidgetCode(widgetCodeRes.data.widgetCode);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load integration data');
        navigate('/integrations');
      }
    };
    
    fetchData();
  }, [id, navigate]);
  
  const handleCopyCode = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(widgetCode)
        .then(() => toast.success('Widget code copied to clipboard'))
        .catch(() => toast.error('Failed to copy code'));
    }
  };
  
  const generateNewApiKey = async () => {
    if (!window.confirm('Are you sure you want to generate a new API key? This will invalidate the previous key and require updating the widget code on your website.')) {
      return;
    }
    
    setRegenerating(true);
    
    try {
      // Generate new API key
      const keyRes = await axios.post(`/api/integration/${id}/generate-key`);
      
      // Update local state with new API key
      setIntegration({
        ...integration,
        apiKey: keyRes.data.apiKey
      });
      
      // Fetch updated widget code
      const widgetCodeRes = await axios.get(`/api/integration/${id}/widget-code`);
      setWidgetCode(widgetCodeRes.data.widgetCode);
      
      toast.success('New API key generated successfully');
    } catch (err) {
      console.error('Error generating API key:', err);
      toast.error('Failed to generate new API key');
    } finally {
      setRegenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/integrations')}
          className="flex items-center text-primary hover:underline"
        >
          <FaArrowLeft className="mr-2" /> Back to Integrations
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">Widget Installation Code</h1>
          <p className="text-gray-600 mb-6">
            Add this code to your website to display the HelpMate AI chat widget. Place it just before the closing &lt;/body&gt; tag.
          </p>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2">
              <span className="text-gray-300 text-sm">Widget Code</span>
              <button 
                onClick={handleCopyCode} 
                className="text-gray-300 hover:text-white focus:outline-none flex items-center text-sm"
              >
                <FaCopy className="mr-1" /> Copy Code
              </button>
            </div>
            <pre 
              ref={codeRef}
              className="p-4 text-gray-300 overflow-x-auto text-sm font-mono whitespace-pre-wrap"
            >
              {widgetCode}
            </pre>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Implementation Tips</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Make sure the script is loaded after your page content.</li>
                    <li>The chat widget will automatically initialize when the page loads.</li>
                    <li>The widget is responsive and works on mobile devices.</li>
                    <li>Customize the appearance through your integration settings.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <FaKey className="mr-2 text-primary" /> API Key
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This key authenticates your website with our service. Keep it confidential and don't expose it in client-side code outside of the widget.
            </p>
            
            <div className="flex items-center">
              <div className="bg-gray-100 px-4 py-2 rounded-lg flex-grow font-mono text-sm">
                {integration.apiKey}
              </div>
              <button
                onClick={generateNewApiKey}
                disabled={regenerating}
                className="ml-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center disabled:bg-gray-500"
              >
                {regenerating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <FaRedo className="mr-2" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-red-600 mt-2">
              Warning: Regenerating the API key will invalidate the previous key and require updating the code on your website.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
              <li>Copy the widget code above.</li>
              <li>Paste it into your website's HTML just before the closing <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> tag.</li>
              <li>Test the chat widget on your website.</li>
              <li>Customize the appearance and behavior through your integration settings as needed.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationWidgetCode;