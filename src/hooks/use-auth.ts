
'use client';

import { useContext } from 'react';
import { AuthContext, AttendanceRecord, EmployeeReport, ScanningRecord } from '@/context/auth-provider';

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
