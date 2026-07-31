import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '../../services/api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Error loading stats</div>;

  return (
    <div>
      <div className="admin-page-header" style={{ marginBottom: '2rem' }}>
        <h2>System Overview</h2>
        <p>Welcome to the Shop Management Portal.</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <div className="card" style={{borderTop:'4px solid #3b82f6', padding:'1.5rem'}}>
          <h3 style={{color:'var(--gray)', fontSize:'0.875rem', textTransform:'uppercase'}}>Total Customers</h3>
          <p style={{fontSize:'2rem', fontWeight:700, margin:0}}>{stats.totalCustomers}</p>
        </div>
        <div className="card" style={{borderTop:'4px solid #8b5cf6', padding:'1.5rem'}}>
          <h3 style={{color:'var(--gray)', fontSize:'0.875rem', textTransform:'uppercase'}}>Total Bookings</h3>
          <p style={{fontSize:'2rem', fontWeight:700, margin:0}}>{stats.totalBookings}</p>
        </div>
        <div className="card" style={{borderTop:'4px solid #f59e0b', padding:'1.5rem'}}>
          <h3 style={{color:'var(--gray)', fontSize:'0.875rem', textTransform:'uppercase'}}>Completed Washes</h3>
          <p style={{fontSize:'2rem', fontWeight:700, margin:0}}>{stats.completedWashes}</p>
        </div>
        <div className="card" style={{borderTop:'4px solid #10b981', padding:'1.5rem'}}>
          <h3 style={{color:'var(--gray)', fontSize:'0.875rem', textTransform:'uppercase'}}>Today's Bookings</h3>
          <p style={{fontSize:'2rem', fontWeight:700, margin:0}}>{stats.todaysBookings}</p>
        </div>
        <div className="card" style={{borderTop:'4px solid #dc2626', padding:'1.5rem'}}>
          <h3 style={{color:'var(--gray)', fontSize:'0.875rem', textTransform:'uppercase'}}>Total Revenue</h3>
          <p style={{fontSize:'2rem', fontWeight:700, margin:0}}>₹{stats.totalRevenue}</p>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div style={{padding:'1.5rem', borderBottom:'1px solid var(--border-light)'}}>
          <h3 style={{margin:0}}>Recent Bookings</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentBookings.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '2rem'}}>No recent bookings</td></tr>
            ) : (
              stats.recentBookings.map(b => (
                <tr key={b._id}>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td>{b.userId?.name}</td>
                  <td>{b.serviceId?.serviceName || 'N/A'}</td>
                  <td>₹{b.totalAmount}</td>
                  <td>
                    <span className={`badge ${
                      b.bookingStatus === 'completed' ? 'badge-success' : 
                      b.bookingStatus === 'cancelled' ? 'badge-danger' : 
                      'badge-warning'
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
