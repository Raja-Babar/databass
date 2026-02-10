'use client';

import { useContext } from 'react';
import { AuthContext, User } from '@/context/auth-provider'; // Removed unused type imports

// This context type now exclusively handles authentication and user management
type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userId: string, data: Partial<Omit<User, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  requiredIp: string;
  setRequiredIp: (ip: string) => Promise<void>;
  appLogo: string;
  updateAppLogo: (logo: string) => Promise<void>;
  getUsers: () => User[];
};

// This hook remains the same, but the context it provides is now leaner
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
