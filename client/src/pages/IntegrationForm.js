import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaSpinner, FaArrowLeft, FaLink, FaGlobe, FaBrush, FaComment, 
         FaCheck, FaTimes, FaTrash, FaFileUpload, FaFile } from 'react-icons/fa';

const IntegrationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    widgetSettings: {
      primaryColor: '#4F46E5',
      position: 'bottom-right',
      welcomeMessage: 'Hi there! How can I help you today?',
      chatTitle: 'Customer Support'
    },
    knowledgeBase: {
      enabled: false,
      urls: []
    },
    allowFileAttachments: false,
    active: true
  });

  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchIntegration = async () => {
        try {
          const res = await axios.get(`/api/integration/${id}`);
          setFormData(res.data.data);
          
          if (res.data.data.knowledgeBase && 
              res.data.data.knowledgeBase.documents && 
              res.data.data.knowledgeBase.documents.length > 0) {
            setDocuments(res.data.data.knowledgeBase.documents);
          }
        } catch (err) {
          console.error('Error fetching integration:', err);
          toast.error('Failed to load integration data');
          navigate('/integrations');
        } finally {
          setLoading(false);
        }
      };

      fetchIntegration();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    
    if (!newUrl.trim()) {
      return;
    }
    
    if (!newUrl.match(/^(http|https):\/\/[a-zA-Z0-9-_.]+\.[a-zA-Z0-9-_.]+/)) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    if (!formData.knowledgeBase.urls.includes(newUrl)) {
      setFormData({
        ...formData,
        knowledgeBase: {
          ...formData.knowledgeBase,
          urls: [...formData.knowledgeBase.urls, newUrl]
        }
      });
      setNewUrl('');
    } else {
      toast.warning('This URL is already in your list');
    }
  };

  const handleRemoveUrl = (urlToRemove) => {
    setFormData({
      ...formData,
      knowledgeBase: {
        ...formData.knowledgeBase,
        urls: formData.knowledgeBase.urls.filter(url => url !== urlToRemove)
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEditMode) {
        await axios.put(`/api/integration/${id}`, formData);
        toast.success('Integration updated successfully');
      } else {
        await axios.post('/api/integration', formData);
        toast.success('Integration created successfully');
      }
      
      navigate('/integrations');
    } catch (err) {
      console.error('Error saving integration:', err);
      toast.error('Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }
    
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.rtf', '.md'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('File type not supported. Please upload PDF, TXT, DOC, DOCX, RTF or MD files.');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const res = await axios.post(`/api/integration/${id}/knowledge/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setDocuments(prevDocs => [...prevDocs, res.data.document]);
      
      toast.success('Document uploaded successfully');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`/api/integration/${id}/knowledge/document/${docId}`);
      
      setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== docId));
      
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Integration' : 'Add New Website Integration'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Basic Information</h2>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Integration Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="My Website"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                A name to identify this integration in your dashboard.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaGlobe className="mr-2 text-gray-500" />
                  Website Domain
                </div>
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The full domain where this chat widget will be installed.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-6">
                When disabled, the chat widget won't be accessible on your website.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
              <div className="flex items-center">
                <FaBrush className="mr-2 text-primary" />
                Widget Appearance
              </div>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="widgetSettings.primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex">
                  <input
                    type="color"
                    id="widgetSettings.primaryColor"
                    name="widgetSettings.primaryColor"
                    value={formData.widgetSettings.primaryColor}
                    onChange={handleChange}
                    className="h-10 w-10 border border-gray-300 rounded mr-2"
                  />
                  <input
                    type="text"
                    value={formData.widgetSettings.primaryColor}
                    onChange={handleChange}
                    name="widgetSettings.primaryColor"
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="widgetSettings.position" className="block text-sm font-medium text-gray-700 mb-1">
                  Widget Position
                </label>
                <select
                  id="widgetSettings.position"
                  name="widgetSettings.position"
                  value={formData.widgetSettings.position}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="widgetSettings.chatTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Chat Title
              </label>
              <input
                type="text"
                id="widgetSettings.chatTitle"
                name="widgetSettings.chatTitle"
                value={formData.widgetSettings.chatTitle}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Customer Support"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="widgetSettings.welcomeMessage" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaComment className="mr-2 text-gray-500" />
                  Welcome Message
                </div>
              </label>
              <textarea
                id="widgetSettings.welcomeMessage"
                name="widgetSettings.welcomeMessage"
                value={formData.widgetSettings.welcomeMessage}
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Hi there! How can I help you today?"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                The first message visitors will see when opening the chat.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
              <div className="flex items-center">
                <FaLink className="mr-2 text-primary" />
                Knowledge Base
              </div>
            </h2>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="knowledgeBase.enabled"
                  name="knowledgeBase.enabled"
                  checked={formData.knowledgeBase.enabled}
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                <label htmlFor="knowledgeBase.enabled" className="text-sm font-medium text-gray-700">
                  Enable Knowledge Base
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-6">
                Allow the AI to scrape and use content from your website URLs to provide more accurate answers.
              </p>
            </div>

            {formData.knowledgeBase.enabled && (
              <>
                <div className="mb-4 pl-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URLs to use as context
                  </label>
                  
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/product-page"
                    />
                    <button
                      onClick={handleAddUrl}
                      className="bg-primary text-white px-4 py-2 rounded-r hover:bg-opacity-90"
                      type="button"
                    >
                      Add URL
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 mt-2">
                    {formData.knowledgeBase.urls.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No URLs added yet. Add some URLs to improve AI responses.
                      </p>
                    ) : (
                      <ul className="max-h-40 overflow-y-auto">
                        {formData.knowledgeBase.urls.map((url, index) => (
                          <li key={index} className="flex justify-between items-center py-1 text-sm">
                            <span className="truncate mr-2 text-gray-700">{url}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUrl(url)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Add URLs to important pages like product docs, FAQs, and pricing pages.
                  </p>
                </div>
                
                <div className="mb-4 pl-6 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload documents (PDF, TXT, DOC, etc.)
                  </label>
                  
                  <div className="flex mb-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.txt,.doc,.docx,.rtf,.md"
                    />
                    <div className="flex flex-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                        type="button"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <FaSpinner className="animate-spin mr-2" />
                        ) : (
                          <FaFileUpload className="mr-2" />
                        )}
                        {uploading ? 'Uploading...' : 'Select File'}
                      </button>
                      <p className="ml-3 text-sm text-gray-500 self-center">
                        Max file size: 10MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 mt-2">
                    {documents.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">No documents uploaded yet</p>
                    ) : (
                      <ul className="space-y-2">
                        {documents.map((doc) => (
                          <li key={doc._id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded">
                            <div className="flex items-center">
                              <FaFile className="text-blue-400 mr-2" />
                              <span className="truncate max-w-md">{doc.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-3">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => handleDeleteDocument(doc._id)}
                                className="text-red-500 hover:text-red-700"
                                type="button"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/integrations')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center bg-primary text-white px-6 py-2 rounded-md hover:bg-opacity-90 disabled:bg-opacity-70"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {isEditMode ? 'Update Integration' : 'Create Integration'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationForm;