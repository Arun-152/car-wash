import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOTPAPI, forgotPasswordAPI } from '../../services/api';

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
    <div className="container" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Verify OTP</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Please enter the 6-digit OTP sent to your email.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>OTP</label>
            <input
              type="text"
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {timer > 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', borderColor: 'transparent', color: 'var(--primary)', fontWeight: '600' }}
                onClick={handleResendOTP}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/forgot-password" className="btn btn-outline" style={{ width: '100%' }}>
              Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
