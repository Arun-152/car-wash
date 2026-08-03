import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Droplets, Menu, X, ChevronDown, User, Car, Calendar, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmModal from './ConfirmModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <Droplets className="brand-icon" size={24} strokeWidth={2.5} />
          <span className="brand-text">Clean Wash</span>
        </Link>

        {/* Desktop Navigation Center */}
        <nav className="navbar-nav desktop-only">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Services</NavLink>
          {user && user.role === 'customer' && (
            <NavLink to="/my-bookings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>My Bookings</NavLink>
          )}
          <NavLink to="/book" className="btn btn-primary" style={{ marginLeft: '8px' }}>Book a Wash</NavLink>
        </nav>

        {/* Desktop Authentication / Profile Right */}
        <div className="navbar-actions desktop-only">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="btn btn-primary">Admin Dashboard</Link>
              )}
              <div className="profile-dropdown-container" ref={dropdownRef}>
                <button
                  className="profile-toggle"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                >
                  <div className="profile-avatar">
                    <User size={20} />
                  </div>
                  <span className="profile-name">{user.name}</span>
                  <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="profile-dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} /> My Profile
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-danger" onClick={handleLogoutClick}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={() => setIsMenuOpen(false)} end>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={() => setIsMenuOpen(false)}>Services</NavLink>
          {user && user.role === 'customer' && (
            <>
              <NavLink to="/my-bookings" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>My Bookings</NavLink>
              <NavLink to="/my-vehicles" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>My Vehicles</NavLink>
            </>
          )}
          {user && (
            <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>Profile</NavLink>
          )}

          <NavLink to="/book" className="btn btn-primary" style={{ marginTop: '16px', display: 'block', textAlign: 'center' }}>Book a Wash</NavLink>

          {user && user.role === 'admin' && (
            <Link to="/admin/dashboard" className="mobile-link">Admin Dashboard</Link>
          )}
        </div>

        <div className="mobile-nav-footer">
          {user ? (
            <button onClick={handleLogoutClick} className="btn btn-outline btn-block" style={{ width: '100%' }}>
              Logout
            </button>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
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
    </header>
  );
};

export default Navbar;
