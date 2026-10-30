import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setStoredToken, removeStoredToken, getStoredToken } from '../api';

const GUEST_CART_KEY = 'cravecart_guest_cart';

export type DemoProfileKey = 'aarav' | 'divya' | 'admin' | 'delivery_agent' | 'customer';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: DemoProfileKey) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (getStoredToken()) {
        const res = await api.getCurrentUser();
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    // User-specific isolation: clear any guest cart leftovers
    try {
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {}
    await refreshUser();
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    try {
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {}
    await refreshUser();
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {}
  };

  // Demo helper: calls the authentic /api/auth/login endpoint with stored bcrypt hashes
  const switchDemoRole = async (role: DemoProfileKey) => {
    setIsLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@cravecart.com', 'Admin@123');
      } else if (role === 'delivery_agent') {
        await login('vikram@cravecart.com', 'Agent@123');
      } else if (role === 'divya') {
        // Customer 2: Divya Sundaram (has 2 completed qualifying orders; next order unlocks 10% Gold tier)
        await login('divya@cravecart.com', 'Divya@123');
      } else {
        // Customer 1: Aarav Sharma (has 6 completed qualifying orders; 20% Platinum tier)
        await login('aarav@example.com', 'Customer@123');
      }
    } catch (err: any) {
      console.error('Demo role switch error:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
