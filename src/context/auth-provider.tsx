'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  attendanceRecords as defaultAttendanceRecords, 
  employeeReports as defaultEmployeeReports, 
  scanningProgressRecords as defaultScanningProgressRecords 
} from '@/lib/placeholder-data';

// --- Types ---
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

export type AttendanceRecord = {
  employeeId: string;
  name: string;
  date: string;
  timeIn: string;
  timeOut: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Not Marked';
};

export type EmployeeReport = {
    id: string;
    employeeId: string;
    employeeName: string;
    submittedDate: string;
    submittedTime: string;
    stage: string;
    type: string;
    quantity: number;
};

export type ScanningRecord = {
  book_id: string;
  title: string;
  status: string;
  scanner: string | null;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getUsers: () => any[];
  updateAttendance: (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean }) => void;
  attendanceRecords: AttendanceRecord[];
  employeeReports: EmployeeReport[];
  appLogo: string;
  requiredIp: string;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [requiredIp, setRequiredIpState] = useState('');
  const [appLogo, setAppLogo] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // --- Sync Helpers ---
  const syncAttendanceToStorage = (records: AttendanceRecord[]) => {
    localStorage.setItem('attendance', JSON.stringify(records));
    setAttendanceRecords(records);
  };

  // --- Core Auth Logic ---
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // 1. Check Supabase Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (dbUser) {
          setUser(dbUser as User);
        }
      }

      // 2. Load Metadata (IP, Logo, Attendance)
      setRequiredIpState(localStorage.getItem('requiredIp') || '');
      setAppLogo(localStorage.getItem('appLogo') || '');
      
      const storedAttendance = localStorage.getItem('attendance');
      setAttendanceRecords(storedAttendance ? JSON.parse(storedAttendance) : defaultAttendanceRecords);

      const storedReports = localStorage.getItem('employeeReports');
      setEmployeeReports(storedReports ? JSON.parse(storedReports) : defaultEmployeeReports);

      setIsLoading(false);
    };

    initAuth();

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) setUser(data as User);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // --- Auth Actions ---
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      setIsLoading(false);
      throw error;
    }

    const { data: dbUser } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (dbUser?.status === 'Pending') {
      await supabase.auth.signOut();
      setIsLoading(false);
      throw new Error('Your account is pending approval.');
    }
    
    setUser(dbUser as User);
    setIsLoading(false);
    router.push('/dashboard');
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, role } }
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (data.user) {
      // Create user in our custom 'users' table
      await supabase.from('users').insert([{
        id: data.user.id,
        name,
        email,
        role,
        status: 'Pending'
      }]);
    }
    setIsLoading(false);
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }, [supabase, router]);

  // --- Attendance Action ---
  const updateAttendance = (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean }) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    let updated = [...attendanceRecords];
    const index = updated.findIndex(r => r.employeeId === employeeId && r.date === today);

    if (index !== -1) {
      if (actions.clockIn) updated[index].timeIn = currentTime;
      if (actions.clockOut) updated[index].timeOut = currentTime;
      if (actions.markLeave) updated[index].status = 'Leave';
      else updated[index].status = 'Present';
    } else {
      const newUser = user; // Current user
      updated.push({
        employeeId,
        name: user?.name || 'Employee',
        date: today,
        timeIn: actions.clockIn ? currentTime : '--:--',
        timeOut: '--:--',
        status: actions.markLeave ? 'Leave' : 'Present'
      });
    }
    syncAttendanceToStorage(updated);
  };

  const getUsers = () => []; // Admin management can fetch directly from Supabase

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    getUsers,
    attendanceRecords,
    updateAttendance,
    employeeReports,
    appLogo,
    requiredIp,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}