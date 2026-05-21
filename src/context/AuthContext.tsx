import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | { uid: string, email: string, role?: 'admin' | 'buyer' } | null;
  loading: boolean;
  loginMock: (role?: 'admin' | 'buyer') => void;
  logoutMock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | { uid: string, email: string, role?: 'admin' | 'buyer' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) setUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginMock = (role: 'admin' | 'buyer' = 'admin') => {
    const mockUser = { 
      uid: 'mock-' + Math.random().toString(36).substring(7), 
      email: role === 'admin' ? 'admin@sidomukti.com' : 'buyer@sidomukti.com',
      role
    };
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const logoutMock = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginMock, logoutMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

