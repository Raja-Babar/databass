
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { attendanceRecords as defaultAttendanceRecords, employeeReports as defaultEmployeeReports, scanningProgressRecords as defaultScanningProgressRecords } from '@/lib/placeholder-data';

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

type StoredUser = User & { passwordHash: string };

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
  file_name: string;
  title_english: string;
  title_sindhi: string;
  author_english: string;
  author_sindhi: string;
  year: string;
  language: string;
  link: string;
  status: string;
  scanned_by: string | null;
  assigned_to: string | null;
  uploaded_by: string | null;
  source: string;
  created_time: string;
  last_edited_time: string;
  last_edited_by: string | null;
  month: string;
};

const defaultLogo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxEPDxEPEA8QDw8PDw8PDw8PDw8PDw8PFREBFiARFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OFw8QDisZFRkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBEQACEQEDEQH/xAAcAAEAAwEBAQEBAAAAAAAAAAAABgcFAwQIAgH/xABEEAABAwMCAwUEBwQJAwUAAAABAAIDBAURBhIhBzFBEyJRYXEUMoGRoRUjQlKxwdEWYnLh8PGy0gozQ2OCkqLCF0ST/wADAMBAAIRAxEAPwDcaIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiA//AECBAIDAwECBAQDBAcCARIxAAIDBCExEEFBURJhBnEFIjKBkUKhscHRM+HwFOHxI3KSokNTgpKyIzRTs//EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDcaIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAAIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAi-i-';

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getUsers: () => Omit<StoredUser, 'passwordHash'>[];
  importUsers: (users: StoredUser[]) => Promise<void>;
  resetUsers: () => Promise<void>;
  updateUser: (email: string, data: Partial<Omit<User, 'email'>>) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  approveUser: (email: string) => Promise<void>;
  attendanceRecords: AttendanceRecord[];
  updateAttendance: (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean }) => void;
  updateAttendanceRecord: (employeeId: string, date: string, data: Partial<Omit<AttendanceRecord, 'employeeId' | 'date' | 'name'>>) => void;
  deleteAttendanceRecord: (employeeId: string, date: string) => void;
  employeeReports: EmployeeReport[];
  addEmployeeReport: (report: Omit<EmployeeReport, 'id'> & { id?: string }) => void;
  updateEmployeeReport: (reportId: string, data: Partial<Omit<EmployeeReport, 'id'>>) => void;
  deleteEmployeeReport: (reportId: string) => void;
  requiredIp: string;
  setRequiredIp: (ip: string) => void;
  importScanningRecords: (records: ScanningRecord[]) => void;
  appLogo: string;
  updateAppLogo: (logo: string) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const simpleHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getDefaultUsers = async (): Promise<{ [email: string]: StoredUser }> => ({
  'admin@example.com': { id: 'EMP001', name: 'Ali Khan', email: 'admin@example.com', role: 'Admin', status: 'Approved', passwordHash: await simpleHash('admin123') },
  'employee@example.com': { id: 'EMP101', name: 'Employee User', email: 'employee@example.com', role: 'I.T & Scanning-Employee', status: 'Approved', passwordHash: await simpleHash('emp123') },
  'supervisor@example.com': { id: 'EMP000', name: 'Supervisor', email: 'supervisor@example.com', role: 'Admin', status: 'Approved', passwordHash: await simpleHash('super123') },
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mockUsers, setMockUsers] = useState<{ [email: string]: StoredUser }>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [requiredIp, setRequiredIpState] = useState('');
  const [appLogo, setAppLogo] = useState(defaultLogo);


  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const syncUsersToStorage = useCallback((users: { [email: string]: StoredUser }) => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
      // Force a re-render in other components that use `getUsers`
      setMockUsers(users);
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  }, []);

  const syncAttendanceToStorage = useCallback((records: AttendanceRecord[]) => {
    try {
      localStorage.setItem('attendance', JSON.stringify(records));
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Failed to save attendance to localStorage", error);
    }
  }, []);
  
  const syncReportsToStorage = useCallback((records: EmployeeReport[]) => {
    try {
      localStorage.setItem('employeeReports', JSON.stringify(records));
      setEmployeeReports(records);
    } catch (error) {
      console.error("Failed to save employee reports to localStorage", error);
    }
  }, []);

  const syncScanningToStorage = useCallback((records: ScanningRecord[]) => {
    try {
      localStorage.setItem('scanningProgressRecords', JSON.stringify(records));
    } catch (error) {
      console.error("Failed to save scanning records to localStorage", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         throw new Error("The file is too large to be saved. Please use a smaller file.");
      }
      throw error;
    }
  }, []);
  
  const importScanningRecords = (records: ScanningRecord[]) => {
    try {
      syncScanningToStorage(records);
    } catch (error: any) {
        throw error;
    }
  };

  const updateAppLogo = (logo: string) => {
    setAppLogo(logo);
    localStorage.setItem('appLogo', logo);
  };


  const setRequiredIp = (ip: string) => {
    localStorage.setItem('requiredIp', ip);
    setRequiredIpState(ip);
  };
  
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    if (pathname !== '/login') {
       router.push('/login');
    }
  }, [router, pathname]);

  useEffect(() => {
    const initAuth = async () => {
      let storedUsers: { [email: string]: StoredUser } = {};
      try {
        const usersFromStorage = localStorage.getItem('users');
        if (usersFromStorage) {
          storedUsers = JSON.parse(usersFromStorage);
        } else {
          storedUsers = await getDefaultUsers();
          syncUsersToStorage(storedUsers);
        }
      } catch (error) {
        console.error("Failed to parse users from localStorage, resetting to default.", error);
        storedUsers = await getDefaultUsers();
        syncUsersToStorage(storedUsers);
      }
      setMockUsers(storedUsers);

      let storedAttendance: AttendanceRecord[] = [];
      try {
        const attendanceFromStorage = localStorage.getItem('attendance');
        if (attendanceFromStorage) {
          storedAttendance = JSON.parse(attendanceFromStorage);
        } else {
          storedAttendance = defaultAttendanceRecords;
          syncAttendanceToStorage(storedAttendance);
        }
      } catch (error) {
        console.error("Failed to parse attendance from localStorage, resetting to default.", error);
        storedAttendance = defaultAttendanceRecords;
        syncAttendanceToStorage(storedAttendance);
      }
      setAttendanceRecords(storedAttendance);

      let storedReports: EmployeeReport[] = [];
      try {
        const reportsFromStorage = localStorage.getItem('employeeReports');
        if (reportsFromStorage) {
          storedReports = JSON.parse(reportsFromStorage);
        } else {
          storedReports = defaultEmployeeReports;
          syncReportsToStorage(storedReports);
        }
      } catch (error) {
        console.error("Failed to parse reports from localStorage, resetting to default.", error);
        storedReports = defaultEmployeeReports;
        syncReportsToStorage(storedReports);
      }
      setEmployeeReports(storedReports);

      try {
        const scanningFromStorage = localStorage.getItem('scanningProgressRecords');
        if (!scanningFromStorage) {
            syncScanningToStorage(JSON.parse(defaultScanningProgressRecords));
        }
      } catch (error) {
        console.error("Failed to parse scanning records from localStorage, resetting to default.", error);
        if (!(error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22))) {
           syncScanningToStorage(JSON.parse(defaultScanningProgressRecords));
        }
      }


      const storedIp = localStorage.getItem('requiredIp');
      if (storedIp) {
        setRequiredIpState(storedIp);
      }

      const storedLogo = localStorage.getItem('appLogo');
      if (storedLogo) {
          setAppLogo(storedLogo);
      }

      try {
        const storedUser = localStorage.getItem('user');
        const lastActivity = localStorage.getItem('lastActivity');
        if (storedUser && lastActivity) {
          const lastActivityTime = parseInt(lastActivity, 10);
          if (Date.now() - lastActivityTime < INACTIVITY_TIMEOUT) {
            setUser(JSON.parse(storedUser));
            localStorage.setItem('lastActivity', Date.now().toString());
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('lastActivity');
          }
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
      }
      setIsLoading(false);
    };

    initAuth();
  }, [syncUsersToStorage, syncAttendanceToStorage, syncReportsToStorage, syncScanningToStorage]);

  useEffect(() => {
    let activityTimer: NodeJS.Timeout;
    const resetTimer = () => {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            if(user) {
                toast({
                    variant: 'destructive',
                    title: 'Session Expired',
                    description: 'You have been logged out due to inactivity.',
                });
                logout();
            }
        }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    const activityListener = () => {
        localStorage.setItem('lastActivity', Date.now().toString());
        resetTimer();
    };

    if (user) {
        events.forEach(event => window.addEventListener(event, activityListener));
        resetTimer();
    }

    return () => {
        clearTimeout(activityTimer);
        events.forEach(event => window.removeEventListener(event, activityListener));
    };
  }, [user, logout, toast]);


  const login = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    const passwordHash = await simpleHash(pass);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
        const foundUser = usersFromStorage[email];
        if (foundUser && foundUser.passwordHash === passwordHash) {
          if (foundUser.status === 'Pending') {
            setIsLoading(false);
            reject(new Error('Your account is pending approval.'));
            return;
          }
          const { passwordHash: _, ...userToStore } = foundUser;
          setUser(userToStore);
          localStorage.setItem('user', JSON.stringify(userToStore));
          localStorage.setItem('lastActivity', Date.now().toString());
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Invalid email or password.'));
        }
      }, 500);
    });
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
        if (usersFromStorage[email]) {
          setIsLoading(false);
          reject(new Error('An account with this email already exists.'));
          return;
        }

        const maxId = Object.values(usersFromStorage)
            .filter((u: any) => u && u.id)
            .map((u: any) => parseInt(u.id.replace('EMP', ''), 10))
            .filter(n => !isNaN(n))
            .reduce((max, current) => Math.max(max, current), 0);
        const newIdNumber = maxId + 1;
        const id = `EMP${newIdNumber.toString().padStart(3, '0')}`;
        
        const status: UserStatus = 'Pending';

        const passwordHash = await simpleHash(pass);

        const newUser: StoredUser = { id, name, email, role, passwordHash, status };
        const updatedUsers = { ...usersFromStorage, [email]: newUser };
        
        syncUsersToStorage(updatedUsers);

        const today = new Date().toISOString().split('T')[0];
        const newAttendanceRecord: AttendanceRecord = {
          employeeId: id,
          name: name,
          date: today,
          timeIn: '--:--',
          timeOut: '--:--',
          status: 'Not Marked',
        };
        const attendanceFromStorage = JSON.parse(localStorage.getItem('attendance') || '[]');
        const updatedAttendance = [...attendanceFromStorage, newAttendanceRecord];
        syncAttendanceToStorage(updatedAttendance);

        setIsLoading(false);
        resolve();
      }, 500);
    });
  };
  
  const updateAttendance = (employeeId: string, actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean; }) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const attendanceFromStorage = JSON.parse(localStorage.getItem('attendance') || '[]');
    const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');

    let recordExists = false;
    let updatedAttendance = attendanceFromStorage.map((record: AttendanceRecord) => {
      if (record.employeeId === employeeId && record.date === today) {
        recordExists = true;
        let newTimeIn = record.timeIn;
        let newTimeOut = record.timeOut;
        let newStatus = record.status;

        if (actions.clockIn) {
          newTimeIn = currentTime;
          newStatus = 'Present';
        }
        if (actions.clockOut) {
          newTimeOut = currentTime;
          newStatus = 'Present';
        }
        if (actions.markLeave) {
          newStatus = 'Leave';
          newTimeIn = '--:--';
          newTimeOut = '--:--';
        }
        
        return { ...record, timeIn: newTimeIn, timeOut: newTimeOut, status: newStatus as 'Present' | 'Leave' };
      }
      return record;
    });

    if (!recordExists) {
      const employee = Object.values(usersFromStorage).find((u: any) => u.id === employeeId);
      if (employee) {
        let newStatus: AttendanceRecord['status'] = 'Not Marked';
        let newTimeIn = '--:--';

        if(actions.clockIn) {
            newStatus = 'Present';
            newTimeIn = currentTime;
        } else if (actions.markLeave) {
            newStatus = 'Leave';
        }
        
        updatedAttendance.push({
          employeeId: employeeId,
          name: (employee as User).name,
          date: today,
          timeIn: newTimeIn,
          timeOut: '--:--',
          status: newStatus,
        });
      }
    }

    syncAttendanceToStorage(updatedAttendance);
  };
  
    const updateAttendanceRecord = (employeeId: string, date: string, data: Partial<Omit<AttendanceRecord, 'employeeId' | 'date' | 'name'>>) => {
        const attendanceFromStorage = JSON.parse(localStorage.getItem('attendance') || '[]');
        const updatedRecords = attendanceFromStorage.map((record: AttendanceRecord) =>
            record.employeeId === employeeId && record.date === date ? { ...record, ...data } : record
        );
        syncAttendanceToStorage(updatedRecords);
    };

    const deleteAttendanceRecord = (employeeId: string, date: string) => {
        const attendanceFromStorage = JSON.parse(localStorage.getItem('attendance') || '[]');
        const updatedRecords = attendanceFromStorage.filter((record: AttendanceRecord) => !(record.employeeId === employeeId && record.date === date));
        syncAttendanceToStorage(updatedRecords);
    };


    const addEmployeeReport = (report: Omit<EmployeeReport, 'id'> & { id?: string }) => {
        const reportsFromStorage = JSON.parse(localStorage.getItem('employeeReports') || '[]');
        const newReport: EmployeeReport = {
            ...report,
            id: report.id || `REP-${Date.now()}`,
        };
        const updatedReports = [newReport, ...reportsFromStorage];
        syncReportsToStorage(updatedReports);
    };

    const updateEmployeeReport = (reportId: string, data: Partial<Omit<EmployeeReport, 'id'>>) => {
        const reportsFromStorage = JSON.parse(localStorage.getItem('employeeReports') || '[]');
        const updatedReports = reportsFromStorage.map((report: EmployeeReport) =>
            report.id === reportId ? { ...report, ...data } : report
        );
        syncReportsToStorage(updatedReports);
    };

    const deleteEmployeeReport = (reportId: string) => {
        const reportsFromStorage = JSON.parse(localStorage.getItem('employeeReports') || '[]');
        const updatedReports = reportsFromStorage.filter((report: EmployeeReport) => report.id !== reportId);
        syncReportsToStorage(updatedReports);
    };

  const getUsers = (): Omit<StoredUser, 'passwordHash'>[] => {
    const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
    return Object.values(usersFromStorage).map((u: any) => {
      const { passwordHash, ...user } = u;
      return user;
    });
  };
  
  const importUsers = async (users: any[]): Promise<void> => {
      const newUsers: { [email: string]: StoredUser } = {};
      for (const u of users) {
          if (u.email && u.name && u.role && u.password && u.id) {
              newUsers[u.email] = {
                  ...u,
                  passwordHash: await simpleHash(u.password),
              };
              delete newUsers[u.email].password;
          }
      }
      syncUsersToStorage(newUsers);
  };

  const resetUsers = async (): Promise<void> => {
    const defaultUsers = await getDefaultUsers();
    syncUsersToStorage(defaultUsers);
    syncAttendanceToStorage(defaultAttendanceRecords);
    syncReportsToStorage(defaultEmployeeReports);
  };

  const updateUser = async (email: string, data: Partial<Omit<User, 'email'>>): Promise<void> => {
    const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
    if (usersFromStorage[email]) {
      const updatedUserRecord = { ...usersFromStorage[email], ...data };
      const updatedUsers = {
        ...usersFromStorage,
        [email]: updatedUserRecord
      };
      syncUsersToStorage(updatedUsers);
      
      if (user?.email === email) {
        const { passwordHash: _, ...userToStore } = updatedUserRecord;
        setUser(userToStore);
        localStorage.setItem('user', JSON.stringify(userToStore));
      }
    }
  };

  const deleteUser = async (email: string): Promise<void> => {
    const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
    const userToDelete = usersFromStorage[email];
    if (userToDelete) {
        delete usersFromStorage[email];
        syncUsersToStorage(usersFromStorage);

        // Also remove related attendance and report records
        const employeeIdToDelete = userToDelete.id;
        const attendanceFromStorage = JSON.parse(localStorage.getItem('attendance') || '[]');
        const updatedAttendance = attendanceFromStorage.filter((rec: AttendanceRecord) => rec.employeeId !== employeeIdToDelete);
        syncAttendanceToStorage(updatedAttendance);

        const reportsFromStorage = JSON.parse(localStorage.getItem('employeeReports') || '[]');
        const updatedReports = reportsFromStorage.filter((rep: EmployeeReport) => rep.employeeId !== employeeIdToDelete);
        syncReportsToStorage(updatedReports);
    }
  };

  const approveUser = async (email: string): Promise<void> => {
    const usersFromStorage = JSON.parse(localStorage.getItem('users') || '{}');
    if (usersFromStorage[email]) {
        usersFromStorage[email].status = 'Approved';
        syncUsersToStorage(usersFromStorage);
    }
  };
  

  const authContextValue: AuthContextType = { user, login, signup, logout, isLoading, getUsers, importUsers, resetUsers, updateUser, deleteUser, approveUser, attendanceRecords, updateAttendance, updateAttendanceRecord, deleteAttendanceRecord, employeeReports, addEmployeeReport, updateEmployeeReport, deleteEmployeeReport, requiredIp, setRequiredIp, importScanningRecords, appLogo, updateAppLogo };

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="w-full max-w-md space-y-4">
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
