import React, { createContext, useContext, useState, useEffect } from 'react';
import storageService from '../services/storage_service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await storageService.getToken();
      const user = await storageService.getUser();
      
      // Clear invalid data if token exists but no user, or vice versa
      if ((token && !user) || (!token && user)) {
        await storageService.clearAll();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!(token && user));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      // Clear any corrupted data
      await storageService.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await storageService.setToken(token);
      await storageService.setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await storageService.clearAll();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 