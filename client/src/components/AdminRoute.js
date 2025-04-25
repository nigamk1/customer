import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// This component checks if user is authenticated and is an admin before allowing access
const AdminRoute = () => {
  // Here you would check if the user is authenticated and has admin role
  // For example, check if there's a token in localStorage and the user has admin role
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // For simplicity, let's assume the user role is stored in localStorage
  // In a real app, you might need to decode a JWT or check with your backend
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  
  // If authenticated and is admin, render the child routes (Outlet)
  // If not, redirect to login page or unauthorized page
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;
