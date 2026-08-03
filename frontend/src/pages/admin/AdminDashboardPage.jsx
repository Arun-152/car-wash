import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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



      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ margin: 0 }}>Monthly Booking Trend</h3>
        </div>
        <div style={{ padding: '2rem', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dx={-10} />
              <Tooltip
                cursor={{ fill: '#f3f4f6', stroke: '#e5e7eb', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Completed Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '4px solid #3b82f6', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.totalBookings}</p>
        </div>
        <div className="card" style={{ borderTop: '4px solid #10b981', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Today's Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.todaysBookings}</p>
        </div>

        <div className="card" style={{ borderTop: '4px solid #8b5cf6', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Completed Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.completedBookings}</p>
        </div>
        <div className="card" style={{ borderTop: '4px solid #ef4444', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Cancelled Bookings</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.cancelledBookings}</p>
        </div>
        <div className="card" style={{ borderTop: '4px solid #f59e0b', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Customers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.totalCustomers}</p>
        </div>
        <div className="card" style={{ borderTop: '4px solid #14b8a6', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--gray)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>₹{stats.totalRevenue}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
