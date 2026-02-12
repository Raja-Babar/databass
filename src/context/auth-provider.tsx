'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

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
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  requiredIp: string;
  setRequiredIp: (ip: string) => Promise<void>;
  appLogo: string;
  updateAppLogo: (logo: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiredIp, setRequiredIpState] = useState('0.0.0.0');
  const [appLogo, setAppLogo] = useState('/logo.png');
  
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

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
      const formattedUser = { 
        ...profile, 
        status: profile.is_approved ? 'Approved' : 'Pending', 
        avatar: profile.avatar_url 
      };
      setUser(formattedUser);
      return formattedUser;
    }
    return null;
  }, []);

  // Initial Auth Check & Session Management
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetchSettings();
        
        if (session) {
          const profile = await fetchCurrentUser(session.user.id);
          if (!profile?.is_approved) {
            await supabase.auth.signOut();
            setUser(null);
          }
        } 
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await fetchCurrentUser(session.user.id);
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Run only once

  useEffect(() => {
    if (!isLoading && user) {
      const isAdminRoute = pathname.startsWith('/dashboard/admin');
      
      // Agar user Admin nahi hai aur Admin route par jane ki koshish kare
      if (isAdminRoute && user.role !== 'Admin') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to access the admin area."
        });
        router.replace('/dashboard');
      }
    }
  }, [pathname, user, isLoading, router, toast]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    if(user) await fetchCurrentUser(user.id);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.user) {
        const profile = await fetchCurrentUser(data.user.id);
        if (profile && !profile.is_approved) {
          await supabase.auth.signOut();
          throw new Error('Your account is pending approval from an admin.');
        }
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password: pass, 
        options: { data: { name, role, is_approved: role === 'Admin' } } 
      });
      if (error) throw error;
      toast({ title: 'Signup Successful', description: 'Please check your email to confirm.' });
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setRequiredIp = async (ip: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'requiredIp', value: ip }, { onConflict: 'key' });
    if (!error) { setRequiredIpState(ip); toast({ title: 'IP Updated' }); }
  };
  
  const updateAppLogo = async (logo: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'appLogo', value: logo }, { onConflict: 'key' });
    if (!error) { setAppLogo(logo); toast({ title: 'Logo Updated' }); }
  };

  const authContextValue = { 
    user, login, signup, logout, isLoading, refreshUser,
    requiredIp, setRequiredIp, appLogo, updateAppLogo,
  };

  // --- RENDERING ---
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Initializing MHPISSJ Portal
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}