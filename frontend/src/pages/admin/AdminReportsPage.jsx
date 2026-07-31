import React from 'react';
import './AdminPages.css';

const AdminReportsPage = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Business Reports & Analytics</h2>
        <p>Export financial data and analyze shop performance.</p>
      </div>

      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--gray)' }}>Advanced Analytics and Reports generation coming soon.</h3>
        <p style={{ color: 'var(--gray)' }}>Basic metrics are available on the Dashboard.</p>
      </div>
    </div>
  );
};

export default AdminReportsPage;
