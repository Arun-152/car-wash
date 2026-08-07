import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Car, Wallet, User, LogOut, Menu, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import './UserSidebar.css';

const UserSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button className="user-sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="user-sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className={`user-sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="user-sidebar-header desktop-hidden">
          <h3>My Account</h3>
          <button className="close-sidebar-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="user-sidebar-nav">
          <NavLink to="/" className={({ isActive }) => (isActive && location.pathname === '/' ? 'user-nav-item active' : 'user-nav-item')} end>
            <LayoutDashboard size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink to="/services" className={({ isActive }) => (isActive ? 'user-nav-item active' : 'user-nav-item')}>
            <Car size={20} />
            <span>Services</span>
          </NavLink>

          <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'user-nav-item active' : 'user-nav-item'}>
            <Calendar size={20} />
            <span>My Bookings</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => (isActive && location.pathname === '/profile' ? 'user-nav-item active' : 'user-nav-item')} end>
            <User size={20} />
            <span>Profile</span>
          </NavLink>

          <NavLink to="/my-vehicles" className={({ isActive }) => isActive ? 'user-nav-item active' : 'user-nav-item'}>
            <Car size={20} />
            <span>My Vehicles</span>
          </NavLink>

          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'user-nav-item active' : 'user-nav-item'}>
            <Wallet size={20} />
            <span>Wallet</span>
          </NavLink>
        </nav>

        <div className="user-sidebar-footer">
          <button className="user-nav-item logout-btn" onClick={handleLogoutClick}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

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
    </>
  );
};

export default UserSidebar;
