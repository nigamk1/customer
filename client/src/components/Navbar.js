import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaRobot, FaBars, FaTimes, FaUser, FaHome, FaComments, FaTachometerAlt, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaCog, FaPuzzlePiece, FaTag, FaCreditCard } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path ? 'text-primary font-bold' : '';
  };

  const authLinks = (
    <>
      <li>
        <Link 
          to="/dashboard" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/dashboard')}`}
        >
          <FaTachometerAlt />
          <span>Dashboard</span>
        </Link>
      </li>
      <li>
        <Link 
          to="/chat" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/chat')}`}
        >
          <FaComments />
          <span>Chat</span>
        </Link>
      </li>
      <li>
        <Link 
          to="/subscription/manage" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/subscription/manage')}`}
        >
          <FaCreditCard />
          <span>Subscription</span>
        </Link>
      </li>
      <li>
        <Link 
          to="/integrations" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/integrations')}`}
        >
          <FaPuzzlePiece />
          <span>Integrations</span>
        </Link>
      </li>
      {user && user.isAdmin && (
        <li>
          <Link 
            to="/admin" 
            className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/admin')}`}
          >
            <FaCog />
            <span>Admin</span>
          </Link>
        </li>
      )}
      <li>
        <button
          onClick={logout}
          className="flex items-center space-x-2 hover:text-primary hover:bg-gray-100 w-full text-left px-3 py-2 rounded-lg transition-all"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li>
        <Link 
          to="/pricing" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/pricing')}`}
        >
          <FaTag />
          <span>Pricing</span>
        </Link>
      </li>
      <li>
        <Link 
          to="/login" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/login')}`}
        >
          <FaSignInAlt />
          <span>Login</span>
        </Link>
      </li>
      <li>
        <Link 
          to="/register" 
          className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/register')}`}
        >
          <FaUserPlus />
          <span>Register</span>
        </Link>
      </li>
    </>
  );

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-2' : 'bg-white/95 py-4'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-gradient-to-r from-primary to-blue-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
            <FaRobot className="text-white text-xl" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">HelpMate AI</span>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            onClick={toggleMenu} 
            className="text-dark focus:outline-none bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center space-x-1">
          <li>
            <Link 
              to="/" 
              className={`flex items-center space-x-2 hover:text-primary hover:bg-gray-100 px-3 py-2 rounded-lg transition-all ${isActive('/')}`}
            >
              <FaHome />
              <span>Home</span>
            </Link>
          </li>
          {isAuthenticated ? authLinks : guestLinks}
        </ul>

        {/* User profile if authenticated */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-3 bg-gray-100 py-2 px-4 rounded-full hover:bg-gray-200 transition-all cursor-pointer">
              <div className="bg-gradient-to-r from-secondary to-indigo-500 rounded-full p-2 shadow">
                <FaUser className="text-white" />
              </div>
              <span className="font-medium">{user?.name || 'User'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t mt-2 shadow-lg">
          <ul className="flex flex-col py-3">
            <li>
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 transition-all ${isActive('/')}`}
                onClick={toggleMenu}
              >
                <FaHome />
                <span>Home</span>
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                {user && (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border-y">
                    <div className="bg-gradient-to-r from-secondary to-indigo-500 rounded-full p-2 shadow">
                      <FaUser className="text-white" />
                    </div>
                    <span className="font-medium">{user?.name || 'User'}</span>
                  </div>
                )}
                {authLinks}
              </>
            ) : (
              guestLinks
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;