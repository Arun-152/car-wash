import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User, LogOut, Calendar, CreditCard, BarChart, Clock, Scissors, Menu, X, Settings, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import { getAllBookings } from '../../services/api';
import './AdminLayout.css';

const navItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/admin/services',     icon: Scissors,        label: 'Services'     },
  { to: '/admin/bookings',     icon: Calendar,        label: 'Bookings'     },
  { to: '/admin/availability', icon: Clock,           label: 'Availability' },
  { to: '/admin/users',        icon: Users,           label: 'Users'        },
  { to: '/admin/reports',      icon: BarChart,        label: 'Reports'      },
  { to: '/admin/settings',     icon: Settings,        label: 'Shop Settings'}
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingCancellations, setPendingCancellations] = useState(0);

  const fetchPendingCancellations = async () => {
    try {
      const data = await getAllBookings();
      if (Array.isArray(data)) {
        const count = data.filter(b => b.bookingStatus === 'cancellation-requested').length;
        setPendingCancellations(count);
      }
    } catch (err) {
      console.error('Failed to fetch pending cancellations', err);
    }
  };

  useEffect(() => {
    fetchPendingCancellations();
  }, []);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    toast.success('Logged out successfully.');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2>Shop Admin</h2>
            <span className="role-badge admin-badge">Management</span>
          </div>
          {/* Close button visible only on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <User size={20} />
            <span>Admin: {user?.name}</span>
          </div>
          <button onClick={handleLogoutClick} className="logout-btn admin-logout">
            <LogOut size={20} />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        {/* Top bar with hamburger */}
        <div
          className="admin-topbar card"
          style={{
            borderRadius: 0,
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            padding: '1.5rem 2rem',
          }}
        >
          <div className="topbar-left">
            {/* Hamburger — shown only below 1024px */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <h3>Management Portal</h3>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="notification-icon" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/admin/bookings')}>
              <Bell size={24} style={{ color: 'var(--gray)' }} />
              {pendingCancellations > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  height: '18px',
                  width: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {pendingCancellations}
                </span>
              )}
            </div>
            <span className="date-display">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="admin-content">
          <Outlet context={{ refreshNotifications: fetchPendingCancellations }} />
        </div>
      </main>

      <ConfirmModal 
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default AdminLayout;
