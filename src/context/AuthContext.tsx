import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  jwt?: string; // Added JWT to user type just in case
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
  const [isLoading, setIsLoading] = useState(true); // Start true to wait for checking localStorage

  // 1. FIXED: Load user AND token from localStorage on mount
  useEffect(() => {
    const checkLoggedIn = () => {
      const authToken = localStorage.getItem('auth-token');
      const storedUser = localStorage.getItem('user-data'); // We will look for this now

      if (authToken && storedUser) {
        try {
          // Restore the user from the "Hard Drive"
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

  // 2. FIXED: Save User Data to LocalStorage on Login
  const login = (user: User, authToken: string) => {
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('user-data', JSON.stringify(user)); // Save user details!
    setUser(user);
    closeLoginModal();
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      name: name,
      email: email,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    };
    
    // Auto-login after register
    login(mockUser, 'mock-token-123');
    
    setIsLoading(false);
    return mockUser;
  };

  // 3. FIXED: Remove User Data on Logout
  const logout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
    setUser(null);
    window.location.reload(); // Optional: Refresh to clear any other state
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        register,
        logout,
        isLoading,
      }}
    >
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