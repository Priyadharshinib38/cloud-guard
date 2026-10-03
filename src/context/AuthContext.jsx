import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getSavedSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local session on load
    const saved = getSavedSession();
    if (saved) {
      setUser(saved.user);
      setToken(saved.token);
    }
    setLoading(false);
  }, []);

  const loginUser = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.token && res.user) {
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  };

  const logoutUser = () => {
    apiLogout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
