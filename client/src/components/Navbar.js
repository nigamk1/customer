import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaRobot, FaBars, FaTimes, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const authLinks = (
    <>
      <li>
        <Link to="/dashboard" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
      </li>
      <li>
        <Link to="/chat" className="hover:text-primary transition-colors">
          Chat
        </Link>
      </li>
      {user && user.isAdmin && (
        <li>
          <Link to="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
        </li>
      )}
      <li>
        <button
          onClick={logout}
          className="hover:text-primary transition-colors"
        >
          Logout
        </button>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li>
        <Link to="/login" className="hover:text-primary transition-colors">
          Login
        </Link>
      </li>
      <li>
        <Link to="/register" className="hover:text-primary transition-colors">
          Register
        </Link>
      </li>
    </>
  );

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <FaRobot className="text-primary text-2xl" />
          <span className="text-xl font-bold">HelpMate AI</span>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-dark focus:outline-none">
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-6">
          <li>
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          {isAuthenticated ? authLinks : guestLinks}
        </ul>

        {/* User icon if authenticated */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-2">
            <FaUser className="text-primary" />
            <span className="font-medium">{user?.name}</span>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white py-4">
          <ul className="flex flex-col space-y-3 px-4">
            <li>
              <Link
                to="/"
                className="block hover:text-primary transition-colors"
                onClick={toggleMenu}
              >
                Home
              </Link>
            </li>
            {isAuthenticated ? authLinks : guestLinks}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
