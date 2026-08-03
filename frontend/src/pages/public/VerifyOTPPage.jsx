import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOTPAPI, forgotPasswordAPI } from '../../services/api';
import './AuthPages.css';

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTPAPI({ email, otp });
      toast.success(response.message || 'OTP verified successfully.');
      navigate('/reset-password', { state: { email, otp } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const response = await forgotPasswordAPI(email);
      console.log("Resend OTP response:", response);
      toast.success('OTP sent successfully.');
      setTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-layout">
        {/* Left Side Branding */}
        <div className="auth-brand-side">
          <h1>Security First</h1>
          <p>We've sent a 6-digit code to your email. This helps us ensure it's really you.</p>
        </div>

        {/* Right Side Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Verify OTP</h2>
              <p>Please enter the 6-digit code sent to <strong>{email}</strong></p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">One-Time Password</label>
                <input
                  type="text"
                  className="auth-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-btn"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="auth-timer">
              {timer > 0 ? (
                <span>Resend code in 00:{timer < 10 ? `0${timer}` : timer}</span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOTP}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <Link to="/forgot-password">Back to previous step</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
