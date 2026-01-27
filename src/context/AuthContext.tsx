import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// <--- NEW: Import the real API functions
import { loginUser, registerUser } from '@/utils/api'; 

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  jwt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (user: User, authToken: string) => void;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = () => {
      const authToken = localStorage.getItem('auth-token');
      const storedUser = localStorage.getItem('user-data');

      if (authToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user data");
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user-data');
        }
      }
      setIsLoading(false);
    };

    checkLoggedIn();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const login = (user: User, authToken: string) => {
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('user-data', JSON.stringify(user));
    setUser(user);
    closeLoginModal();
  };

  // <--- FIXED: Replaced Mock Data with Real API Logic
  const register = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      // 1. Call the Real Register API (Sends Name, Email, Password)
      const newUser = await registerUser(name, email, password);
      
      if (!newUser) {
        throw new Error('Registration failed');
      }

      // 2. Automatically Login to get the Token
      // (WordPress registration doesn't give a token, so we log in immediately)
      const loginData = await loginUser(email, password);
      
      if (loginData) {
        // Success! Save user and close modal
        login(loginData.user, loginData.authToken);
        setIsLoading(false);
        return loginData.user;
      } else {
        throw new Error('Auto-login failed');
      }

    } catch (error) {
      console.error("Registration Error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
    
    // Clear Cart Data too (Problem 2 Fix)
    localStorage.removeItem('chronos_cart');
    localStorage.removeItem('woo-session');
    
    setUser(null);
    
    if (window.location.pathname === '/account' || window.location.pathname === '/checkout') {
         window.location.href = '/'; 
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoginModalOpen, 
      openLoginModal, 
      closeLoginModal, 
      login, 
      register, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};