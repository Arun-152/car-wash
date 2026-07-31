import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User, LogOut, Settings, Calendar, CreditCard, BarChart, Clock, Scissors } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Shop Admin</h2>
          <span className="role-badge admin-badge">Management</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/services" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Scissors size={20} /> <span>Services</span>
          </NavLink>
          <NavLink to="/admin/bookings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Calendar size={20} /> <span>Bookings</span>
          </NavLink>
          <NavLink to="/admin/availability" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Clock size={20} /> <span>Availability</span>
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} /> <span>Users</span>
          </NavLink>
          <NavLink to="/admin/payments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <CreditCard size={20} /> <span>Payments</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BarChart size={20} /> <span>Reports</span>
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={20} /> <span>Shop Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={20} /> <span>Admin: {user?.name}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn admin-logout" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LogOut size={20} /> <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <div className="admin-topbar card" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1.5rem 3rem' }}>
          <div className="topbar-left">
            <h3>Management Portal</h3>
          </div>
          <div className="topbar-right">
            <span className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
