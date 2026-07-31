import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log("login attempt",email,password);
      const data = await loginUser({ email, password });
      console.log("login data",data);
      if (data.role !== 'admin') {
        setError('Unauthorized access. This portal is for administrators only.');
        setLoading(false);
        return;
      }
      login(data, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      console.log("login error",err);
      setError(err.response?.data?.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{background:'#0f172a'}}>
      <div style={{display:'flex', justifyContent:'space-between', padding:'1rem 2rem', color:'white'}}>
        <h2 style={{margin:0}}>CarWash Pro</h2>
        <span style={{background:'#dc2626', padding:'0.25rem 0.75rem', borderRadius:'20px', fontSize:'0.875rem', fontWeight:600}}>SECURE ADMIN PORTAL</span>
      </div>

      <div className="container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh'}}>
        <div className="card" style={{padding: '3rem', maxWidth: '400px', width: '100%', borderRadius: '16px', background:'#1e293b', color:'white', border: '1px solid #334155'}}>
          <h2 style={{textAlign: 'center', marginBottom: '2rem', color:'white'}}>Admin Login</h2>
          
          {error && <div className="error-message" style={{background:'rgba(220,38,38,0.2)', color:'#fca5a5', border:'1px solid #dc2626'}}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div>
              <label style={{color:'#94a3b8', display: 'block', marginBottom: '0.5rem'}}>Admin Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{background:'#0f172a', color:'white', border:'1px solid #334155'}}
              />
            </div>
            <div>
              <label style={{color:'#94a3b8', display: 'block', marginBottom: '0.5rem'}}>Password</label>
              <input 
                type="password" 
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{background:'#0f172a', color:'white', border:'1px solid #334155'}}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{background:'#dc2626', borderColor:'#dc2626', marginTop: '1rem'}}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
