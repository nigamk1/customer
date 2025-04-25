import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// This component checks if user is authenticated before allowing access to protected routes
const PrivateRoute = () => {
  // Here you would check if the user is authenticated
  // For example, check if there's a token in localStorage
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // If authenticated, render the child routes (Outlet)
  // If not, redirect to login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
