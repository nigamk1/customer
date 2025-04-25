import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="container mt-4">
      <h1>Admin Dashboard</h1>
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">User Management</h5>
              <p className="card-text">Manage all registered users.</p>
              <button className="btn btn-primary">Manage Users</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Content Management</h5>
              <p className="card-text">Create and manage content.</p>
              <button className="btn btn-primary">Manage Content</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">System Stats</h5>
              <p className="card-text">View system statistics and metrics.</p>
              <button className="btn btn-primary">View Stats</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
