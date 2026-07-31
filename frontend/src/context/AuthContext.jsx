import { createContext, useState, useEffect, useContext } from 'react';
import { getMe } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // Loading state for session check

  // Check existing session on page load
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        localStorage.setItem('token', token);
        try {
          // Fetch user profile to verify token is still valid
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error('Session expired or invalid token');
          logout();
        }
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false); // Finished checking
    };

    checkSession();
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
