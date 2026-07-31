import React from 'react';
import './AdminPages.css';

const AdminPaymentsPage = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Payments Management</h2>
        <p>View and manage all customer payments, refunds, and invoices.</p>
      </div>

      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--gray)' }}>Payments integration detailed view coming soon.</h3>
        <p style={{ color: 'var(--gray)' }}>Payment status is currently visible in the Bookings tab.</p>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
