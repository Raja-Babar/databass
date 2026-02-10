'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// --- Type Definitions ---
export type UserRole = 'Admin' | 'I.T & Scanning-Employee' | 'Library-Employee' | 'Accounts';

export type User = {
  id: string;
  name: string;
  name_sindhi?: string;
  email: string;
  role: string;
  is_approved: boolean;
  status?: 'Approved' | 'Pending';
  phone?: string;
  nic?: string;
  dob?: string;
  dot?: string;
  bank_name?: string;
  bank_details?: string;
  emergency?: string;
  address?: string;
  avatar?: string;
  updated_at?: string;
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>; // Added for profile updates
  deleteUser: (userId: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  requiredIp: string;
  setRequiredIp: (ip: string) => Promise<void>;
  appLogo: string;
  updateAppLogo: (logo: string) => Promise<void>;
  getUsers: () => User[];
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

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      const activeUsers = data.map(u => ({
        ...u,
        status: u.is_approved ? 'Approved' : 'Pending',
        avatar: u.avatar_url,
      }));
      setUsers(activeUsers);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      data.forEach(setting => {
        if (setting.key === 'requiredIp') setRequiredIpState(setting.value);
        if (setting.key === 'appLogo') setAppLogo(setting.value);
      });
    }
  }, []);

  const fetchCurrentUser = useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profile && !error) {
      setUser({ 
        ...profile, 
        status: profile.is_approved ? 'Approved' : 'Pending', 
        avatar: profile.avatar_url 
      });
    }
    return profile;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    setIsLoading(false);
  }, [router]);

  const fetchInitialData = useCallback(async (userId?: string) => {
    await Promise.all([fetchUsers(), fetchSettings()]);
    if (userId) {
      await fetchCurrentUser(userId);
    }
  }, [fetchUsers, fetchSettings, fetchCurrentUser]);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchInitialData(session.user.id);
      setIsLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchInitialData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          await logout();
        }
      });
      return () => { authListener.subscription.unsubscribe(); };
    };
    initAuth();
  }, [fetchInitialData, logout]);

  const refreshUser = async () => {
      if(user) {
          await fetchCurrentUser(user.id);
      }
  };

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
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass, 
      options: { data: { name, role, is_approved: role === 'Admin' } } 
    });
    if (error) { setIsLoading(false); throw new Error(error.message); }
    toast({ title: 'Signup Successful', description: 'Please check your email to confirm.' });
    setIsLoading(false);
  };

  const approveUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Update failed: Row not found or RLS policy block.");
      }

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_approved: true, status: 'Approved' } : u
      ));

      toast({ title: 'Success', description: 'User approved in database.' });
    } catch (error: any) {
      console.error('Approval Error:', error.message);
      toast({ 
        variant: 'destructive', 
        title: 'Approval Failed', 
        description: error.message 
      });
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else { 
      await fetchUsers(); 
      toast({ variant: 'destructive', title: 'User Deleted' }); 
    }
  };

  const setRequiredIp = async (ip: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'requiredIp', value: ip }, { onConflict: 'key' });
    if (!error) { setRequiredIpState(ip); toast({ title: 'IP Address Updated' }); }
  };
  
  const updateAppLogo = async (logo: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'appLogo', value: logo }, { onConflict: 'key' });
    if (!error) { setAppLogo(logo); toast({ title: 'Logo Updated' }); }
  };

  const authContextValue = { 
    user, users, login, signup, logout, isLoading, refreshUser, deleteUser, approveUser,
    requiredIp, setRequiredIp, appLogo, updateAppLogo,
    getUsers: () => users,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-32 w-full" />
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