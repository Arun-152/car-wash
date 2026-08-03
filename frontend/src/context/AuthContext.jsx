import { createContext, useState, useEffect, useContext } from 'react';
import { getMe } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const tokenKey = isAdminPath ? 'adminToken' : 'token';

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || null);
  const [loading, setLoading] = useState(true);

  // Check existing session on page load
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        localStorage.setItem(tokenKey, token);
        try {
          // Fetch user profile to verify token is still valid
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error('Session expired or invalid token');
          logout();
        }
      } else {
        localStorage.removeItem(tokenKey);
      }
      setLoading(false); // Finished checking
    };

    checkSession();
  }, [token, tokenKey]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem(tokenKey, userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(tokenKey);
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
