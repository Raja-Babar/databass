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
type UserRole = 'Admin' | 'Employee' | 'I.T & Scanning-Employee' | 'Library-Employee' | 'Accounts';
type UserStatus = 'Approved' | 'Pending';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
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
  stage: string;
  type: string;
  quantity: number;
};

export type ScanningRecord = {
  book_id: string;
  file_name: string;
  title_english: string;
  status: string;
  // Baki fields aapki requirement ke mutabiq
};

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getUsers: () => any[];
  attendanceRecords: AttendanceRecord[];
  updateAttendance: (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean }) => void;
  employeeReports: EmployeeReport[];
  requiredIp: string;
  setRequiredIp: (ip: string) => void;
  importScanningRecords: (records: any[]) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 mins

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [requiredIp, setRequiredIpState] = useState('');

  // Supabase Client Initialization
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // --- Persistence Sync Helpers ---
  const syncAttendanceToStorage = useCallback((records: AttendanceRecord[]) => {
    localStorage.setItem('attendance', JSON.stringify(records));
    setAttendanceRecords(records);
  }, []);

  const syncReportsToStorage = useCallback((records: EmployeeReport[]) => {
    localStorage.setItem('employeeReports', JSON.stringify(records));
    setEmployeeReports(records);
  }, []);

  // --- Core Auth & Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // 1. Get Session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch extended profile data from our custom 'users' table
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (dbUser && !error) {
          setUser(dbUser as User);
        }
      }

      // 2. Load Local Settings (IP, Logo, Attendance etc)
      setRequiredIpState(localStorage.getItem('requiredIp') || '');
      
      const storedAttendance = localStorage.getItem('attendance');
      setAttendanceRecords(storedAttendance ? JSON.parse(storedAttendance) : defaultAttendanceRecords);

      const storedReports = localStorage.getItem('employeeReports');
      setEmployeeReports(storedReports ? JSON.parse(storedReports) : defaultEmployeeReports);

      setIsLoading(false);
    };

    initAuth();

    // Listen for Real-time Auth State Changes
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

    // Check if user is approved in our 'users' table
    const { data: dbUser } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (dbUser?.status === 'Pending') {
      await supabase.auth.signOut();
      setIsLoading(false);
      throw new Error('Your account is pending approval by the admin.');
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
      // Create user record in our custom table
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
    localStorage.removeItem('user');
    router.push('/login');
  }, [supabase, router]);

  // --- Other Actions ---
  const setRequiredIp = (ip: string) => {
    localStorage.setItem('requiredIp', ip);
    setRequiredIpState(ip);
  };

  const importScanningRecords = (records: any[]) => {
    localStorage.setItem('scanningProgressRecords', JSON.stringify(records));
  };

  const updateAttendance = (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean }) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    let updated = [...attendanceRecords];
    const index = updated.findIndex(r => r.employeeId === employeeId && r.date === today);

    if (index !== -1) {
      if (actions.clockIn) updated[index].timeIn = currentTime;
      if (actions.clockOut) updated[index].timeOut = currentTime;
      updated[index].status = 'Present';
    } else if (actions.clockIn) {
      updated.push({
        employeeId,
        name: user?.name || 'Unknown',
        date: today,
        timeIn: currentTime,
        timeOut: '--:--',
        status: 'Present'
      });
    }
    syncAttendanceToStorage(updated);
  };

  const getUsers = () => []; // Admin panel fetches this directly from Supabase for security

  const value = {
    user,
    login,
    signup,
    logout,
    isLoading,
    getUsers,
    attendanceRecords,
    updateAttendance,
    employeeReports,
    requiredIp,
    setRequiredIp,
    importScanningRecords,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <p className="text-center text-sm text-muted-foreground animate-pulse">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}