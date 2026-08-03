import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPasswordAPI } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    try {
      const response = await resetPasswordAPI({ email, otp, password });
      toast.success(response.message || 'Password changed successfully. Please log in again.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Reset Password</h2>
        
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>
              Back to Forgot Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <Link to="/login" className="btn btn-outline" style={{ textAlign: 'center' }}>
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Reset Password"
        message="Do you want to change your password?"
        confirmText="Confirm"
        cancelText="Cancel"
        type="primary"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ResetPasswordPage;
