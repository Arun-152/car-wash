import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getMyVehicles, addVehicle, updateVehicle, deleteVehicle, changePassword, updateProfile, getMyBookings } from '../../services/api';
import { User, Mail, Phone, Calendar, Bookmark, Wallet, Edit2, Trash2, Car, Eye, EyeOff } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, token, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Stats
  const [totalBookings, setTotalBookings] = useState(0);

  // Edit Profile Modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditProfileConfirmModal, setShowEditProfileConfirmModal] = useState(false);
  const [editProfileFormData, setEditProfileFormData] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState({});

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookingsCount();
    }
  }, [user]);

  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const data = await getMyVehicles();
      setVehicles(data);
    } catch (err) {
      toast.error('Failed to load vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  };

  const fetchBookingsCount = async () => {
    try {
      const data = await getMyBookings();
      setTotalBookings(data.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Edit Profile Logic ---
  const handleEditProfileClick = () => {
    setEditProfileFormData({ name: user?.name || '', phone: user?.phone || '' });
    setShowEditProfileModal(true);
  };

  const handleEditProfileSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!editProfileFormData.name) newErrors.name = 'Name is required';
    else if (editProfileFormData.name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    
    if (!editProfileFormData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(editProfileFormData.phone)) newErrors.phone = 'Phone number must be exactly 10 digits';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setShowEditProfileConfirmModal(true);
  };

  const executeEditProfile = async () => {
    setShowEditProfileConfirmModal(false);
    try {
      const updatedUser = await updateProfile({ name: editProfileFormData.name, phone: editProfileFormData.phone });
      toast.success('Profile updated successfully.');
      setShowEditProfileModal(false);
      login(updatedUser, token);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // --- Password Logic ---
  const handlePasswordInputChange = (e) => {
    setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!passwordFormData.currentPassword) newErrors.currentPassword = 'Current password is required';
    
    if (!passwordFormData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordFormData.newPassword.length < 8) newErrors.newPassword = 'New password must be at least 8 characters long';
    
    if (!passwordFormData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) newErrors.confirmPassword = 'New passwords do not match';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setShowPasswordConfirmModal(true);
  };

  const executeChangePassword = async () => {
    setShowPasswordConfirmModal(false);
    try {
      await changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      });
      setShowPasswordModal(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Force logout and redirect
      logout();
      navigate('/login', { state: { successMessage: 'Password changed successfully. Please log in again.' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="container">
        
        <div className="profile-page-header">
          <h2>My Profile</h2>
          <p>Manage your account settings and vehicles.</p>
        </div>

        <div className="profile-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
          {/* Section A: Profile Information */}
          <div className="profile-left-col">
            <div className="card profile-card">
              <div className="profile-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="profile-name">{user?.name}</h3>
              <p className="profile-email">{user?.email}</p>

              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <div className="profile-stat-label">Wallet Balance</div>
                  <div className="profile-stat-val">₹{user?.walletBalance || 0}</div>
                </div>
                <div className="profile-stat-box">
                  <div className="profile-stat-label">Total Bookings</div>
                  <div className="profile-stat-val">{totalBookings}</div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-outline" onClick={handleEditProfileClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <User size={18} /> Edit Profile
                </button>
                <button className="btn btn-primary" onClick={() => setShowPasswordModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Change Password
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Contact Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--dark)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} color="var(--primary)" /> {user?.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={16} color="var(--primary)" /> {user?.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={16} color="var(--primary)" /> Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => navigate('/my-vehicles')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                <Car size={20} /> + Add Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--dark)' }}>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="pwd-form-group">
                <label>Current Password</label>
                <div className="pwd-input-wrapper">
                  <input type={showCurrentPassword ? 'text' : 'password'} name="currentPassword" value={passwordFormData.currentPassword} onChange={handlePasswordInputChange} />
                  <button type="button" className="pwd-toggle-btn" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.currentPassword}</span>}
              </div>
              <div className="pwd-form-group">
                <label>New Password</label>
                <div className="pwd-input-wrapper">
                  <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordInputChange} />
                  <button type="button" className="pwd-toggle-btn" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.newPassword}</span>}
              </div>
              <div className="pwd-form-group">
                <label>Confirm New Password</label>
                <div className="pwd-input-wrapper">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={passwordFormData.confirmPassword} onChange={handlePasswordInputChange} />
                  <button type="button" className="pwd-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.confirmPassword}</span>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowEditProfileModal(false); }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--dark)' }}>Edit Profile</h3>
            <form onSubmit={handleEditProfileSubmit}>
              <div className="pwd-form-group">
                <label>Full Name</label>
                <div className="pwd-input-wrapper">
                  <input type="text" name="name" value={editProfileFormData.name} onChange={(e) => { setEditProfileFormData({ ...editProfileFormData, name: e.target.value }); setErrors({ ...errors, name: '' }); }} />
                </div>
                {errors.name && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
              </div>
              <div className="pwd-form-group">
                <label>Mobile Number</label>
                <div className="pwd-input-wrapper">
                  <input type="text" name="phone" value={editProfileFormData.phone} onChange={(e) => { setEditProfileFormData({ ...editProfileFormData, phone: e.target.value }); setErrors({ ...errors, phone: '' }); }} />
                </div>
                {errors.phone && <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
              </div>
              <div className="pwd-form-group">
                <label>Email (Read-only)</label>
                <div className="pwd-input-wrapper">
                  <input type="email" value={user?.email || ''} readOnly style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showEditProfileConfirmModal}
        title="Update Profile"
        message="Do you want to save these profile changes?"
        confirmText="Update"
        cancelText="Cancel"
        type="primary"
        onConfirm={executeEditProfile}
        onCancel={() => setShowEditProfileConfirmModal(false)}
      />

      <ConfirmModal 
        isOpen={showPasswordConfirmModal}
        title="Change Password"
        message="Do you want to change your password?"
        confirmText="Update Password"
        cancelText="Cancel"
        type="primary"
        onConfirm={executeChangePassword}
        onCancel={() => setShowPasswordConfirmModal(false)}
      />


    </div>
  );
};

export default ProfilePage;
