import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mt-5 text-center">
      <h1 className="display-1">404</h1>
      <h2 className="mb-4">Page Not Found</h2>
      <p className="lead">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn btn-primary mt-3">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
