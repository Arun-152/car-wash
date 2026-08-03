import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminPages.css';

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

  if (loading) return <div className="admin-loading">Loading Dashboard...</div>;
  if (!stats) return <div className="admin-empty">Error loading dashboard statistics</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>System Overview</h2>
          <p>Welcome to the SparkleWash Management Portal.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Bookings</div>
          <div className="stat-card-value">{stats.totalBookings}</div>
          <div className="stat-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)' }}></div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Today's Bookings</div>
          <div className="stat-card-value">{stats.todaysBookings}</div>
          <div className="stat-card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: '#16a34a' }}></div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Completed</div>
          <div className="stat-card-value">{stats.completedBookings}</div>
          <div className="stat-card-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: '#9333ea' }}></div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Cancelled</div>
          <div className="stat-card-value">{stats.cancelledBookings}</div>
          <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--danger)' }}></div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{stats.totalCustomers}</div>
          <div className="stat-card-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--warning)' }}></div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ fontSize: '1.75rem' }}>₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-card-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: '#0d9488' }}></div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h3>Monthly Booking Trend</h3>
        </div>
        <div style={{ padding: '2rem', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
              <Tooltip
                cursor={{ fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} name="Completed Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
