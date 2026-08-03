import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPasswordAPI } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!email || !otp) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsModalOpen(false);
    setLoading(true);
    try {
      const response = await resetPasswordAPI({ email, otp, password });
      toast.success(response.message || 'Password changed successfully. Please log in again.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-layout">
        {/* Left Side Branding */}
        <div className="auth-brand-side">
          <h1>Almost There!</h1>
          <p>Create a strong, unique password to secure your account.</p>
        </div>

        {/* Right Side Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Reset Password</h2>
              <p>Please enter your new password below.</p>
            </div>

            <form className="auth-form" onSubmit={handlePreSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">New Password</label>
                <input
                  type="password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Confirm Password</label>
                <input
                  type="password"
                  className="auth-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary auth-btn" 
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <Link to="/login" className="btn btn-outline" style={{ textAlign: 'center' }}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Reset Password"
        message="Are you sure you want to change your password?"
        confirmText="Confirm Change"
        cancelText="Cancel"
        type="primary"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ResetPasswordPage;
