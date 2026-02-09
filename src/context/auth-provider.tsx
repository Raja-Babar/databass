'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Type definitions for User, which remains the core responsibility of this provider
type UserRole = 'Admin' | 'I.T & Scanning-Employee' | 'Library-Employee' | 'Accounts';
type UserStatus = 'Approved' | 'Pending';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
};

// The context now only manages user data, settings, and authentication status
type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userId: string, data: Partial<Omit<User, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  requiredIp: string;
  setRequiredIp: (ip: string) => Promise<void>;
  appLogo: string;
  updateAppLogo: (logo: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requiredIp, setRequiredIpState] = useState('0.0.0.0');
  const [appLogo, setAppLogo] = useState('/logo.png');

  const router = useRouter();
  const { toast } = useToast();

  // Fetching users remains a responsibility of the AuthProvider
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      const activeUsers = data.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        status: u.is_approved ? 'Approved' : 'Pending',
      }));
      setUsers(activeUsers);
    }
  }, []);

  // Fetching app settings also remains here as it's a global concern
  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      data.forEach(setting => {
        if (setting.key === 'requiredIp') setRequiredIpState(setting.value);
        if (setting.key === 'appLogo') setAppLogo(setting.value);
      });
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setUsers([]);
    router.push('/login');
    setIsLoading(false);
  }, [router]);

  // The main effect now only initializes auth and fetches users/settings
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUser({ id: session.user.id, name: profile.name, email: profile.email, role: profile.role, status: profile.is_approved ? 'Approved' : 'Pending' });
          await Promise.all([fetchUsers(), fetchSettings()]); // Simplified data fetching
        }
      }
      setIsLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setUser({ id: session.user.id, name: profile.name, email: profile.email, role: profile.role, status: profile.is_approved ? 'Approved' : 'Pending' });
            await Promise.all([fetchUsers(), fetchSettings()]);
          }
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      });
      return () => { authListener.subscription.unsubscribe(); };
    };
    initAuth();
  }, [fetchUsers, fetchSettings, logout]);

  // Login, Signup, and other user management functions remain unchanged
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('is_approved').eq('id', data.user.id).single();
      if (profile && !profile.is_approved) {
        await supabase.auth.signOut();
        setIsLoading(false);
        throw new Error('Your account is pending approval from an admin.');
      }
    }
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name, role } } });
    if (error) { setIsLoading(false); throw new Error(error.message); }
    if (!data.user) { setIsLoading(false); throw new Error("Couldn't create user"); }
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
    if (error) toast({ variant: 'destructive', title: 'Error approving user', description: error.message });
    else { await fetchUsers(); toast({ title: 'User Approved' }); }
  };

  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', userId);
    if (error) toast({ variant: 'destructive', title: 'Error updating user', description: error.message });
    else { await fetchUsers(); toast({ title: 'User Updated' }); }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) toast({ variant: 'destructive', title: 'Error deleting user', description: error.message });
    else { await fetchUsers(); toast({ variant: 'destructive', title: 'User Deleted' }); }
  };

  const setRequiredIp = async (ip: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'requiredIp', value: ip }, { onConflict: 'key' });
    if (!error) { setRequiredIpState(ip); toast({ title: 'IP Address Updated' }); }
    else { toast({ variant: 'destructive', title: 'Failed to update IP' }); }
  };

  const updateAppLogo = async (logo: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'appLogo', value: logo }, { onConflict: 'key' });
    if (!error) { setAppLogo(logo); toast({ title: 'Logo Updated' }); }
    else { toast({ variant: 'destructive', title: 'Failed to update logo' }); }
  };

  // The provided context value is now much leaner
  const authContextValue = { 
    user, users, login, signup, logout, isLoading, updateUser, deleteUser, approveUser,
    requiredIp, setRequiredIp, appLogo, updateAppLogo 
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
