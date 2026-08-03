import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { loginUser } from '../../services/api';
import { toast } from 'react-toastify';
import './AuthPages.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data, data.token);
      toast.success('Login successful! Welcome back.');
      
      // Redirect based on role
      if (data.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-layout">
        {/* Left Side Branding */}
        <div className="auth-brand-side">
          <h1>Welcome Back to SparkleWash</h1>
          <p>Sign in to your account to book your next wash, manage vehicles, and track your wallet balance all in one place.</p>
        </div>

        {/* Right Side Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Sign In</h2>
              <p>Please enter your details to access your account.</p>
            </div>

            {successMessage && (
              <div className="success-message" style={{ marginBottom: '1.5rem' }}>
                {successMessage}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <input 
                  type="email" 
                  className="auth-input"
                  placeholder="Enter your email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="auth-form-group">
                <div className="auth-label-flex">
                  <label className="auth-label">Password</label>
                  <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
                </div>
                <input 
                  type="password" 
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account? <Link to="/register">Create one here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
