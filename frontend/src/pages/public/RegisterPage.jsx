import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { registerCustomer } from '../../services/api';
import { toast } from 'react-toastify';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!emailRegex.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }
    if (!phoneRegex.test(formData.phone)) {
      return toast.error('Phone number must be exactly 10 digits');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    setLoading(true);
    try {
      await registerCustomer(formData);
      navigate('/login', { state: { successMessage: 'Account created successfully. Please login.' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-layout">
        {/* Left Side Branding */}
        <div className="auth-brand-side">
          <h1>Join SparkleWash</h1>
          <p>Create an account to book your washes easily, manage multiple vehicles, and access your personal wallet.</p>
        </div>

        {/* Right Side Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Sign up now to get started with our premium services.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="auth-input" 
                  placeholder="John Doe"
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="auth-input" 
                  placeholder="john@example.com"
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  className="auth-input" 
                  placeholder="10-digit mobile number"
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  className="auth-input" 
                  placeholder="At least 6 characters"
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign in here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
