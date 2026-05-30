import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('barberzap_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Placeholder login - aceita qualquer email/senha
    const userData = { email, name: email.split('@')[0] };
    setUser(userData);
    localStorage.setItem('barberzap_user', JSON.stringify(userData));
    return { success: true, user: userData };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('barberzap_user');
  };

  return <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>{children}</AuthContext.Provider>;
};
