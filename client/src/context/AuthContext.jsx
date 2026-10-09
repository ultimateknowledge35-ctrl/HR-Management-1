import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [settings, setSettings] = useState({
    company_name: 'Apex HR Systems',
    currency_symbol: '$',
    payday_day: 28,
    max_advance_months: 3,
  });
  const [loading, setLoading] = useState(true);

  // Load public settings
  const fetchSettings = async () => {
    try {
      const data = await api.getPublicSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Verify auth on mount
  useEffect(() => {
    fetchSettings();
    if (token) {
      api.getMe()
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    fetchSettings();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateGlobalSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        settings,
        login,
        logout,
        refreshUser,
        updateGlobalSettings,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isStaff: user?.role === 'STAFF',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
