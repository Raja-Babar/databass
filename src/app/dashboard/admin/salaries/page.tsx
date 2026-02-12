'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance, AttendanceRecord } from '@/hooks/itsection/use-attendance'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Salary Map
const salaries = new Map<string, number>([
    ['I.T & Scanning-Employee', 25000],
    ['Library-Employee', 22000],
]);

export default function SalariesPage() {
  // 1. Yahan default empty array [] add ki hai taake undefined ka error na aaye
  const { users = [] } = useAuth(); 
  const { attendanceRecords = [], updateAttendanceRecord, deleteAttendanceRecord } = useAttendance(); 
  
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState('');

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  // 2. filteredUsers mein users array ka safety check
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return []; // Agar users array nahi hai toh khali array dedo
    
    return users.filter(user => 
        user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        user?.role !== 'Admin'
    );
  }, [users, searchQuery]);

  const calculateSalary = (userRole: string, attendance: AttendanceRecord[]) => {
    const baseSalary = salaries.get(userRole) || 0;
    const presentDays = attendance.filter(r => r.status === 'Present').length;
    return (baseSalary / 30) * presentDays;
  };

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    if (!Array.isArray(attendanceRecords)) return [];

    attendanceRecords.forEach(record => {
        if (record.date) {
            const month = record.date.substring(0, 7); // YYYY-MM
            months.add(month);
        }
    });
    return Array.from(months).sort().reverse(); 
  }, [attendanceRecords]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Salaries & Attendance</CardTitle>
          <CardDescription className="font-medium italic">
            Monthly salary calculation based on present days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input 
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-1/3 rounded-xl border-2"
            />
            <Select onValueChange={handleMonthChange} value={selectedMonth}>
                <SelectTrigger className="md:w-1/4 rounded-xl border-2">
                    <SelectValue placeholder="Select a Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    {allMonths.length > 0 ? (
                        allMonths.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>No attendance records</SelectItem>
                    )}
                </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Employee Name</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Present Days</TableHead>
                  <TableHead className="font-bold">Calculated Salary</TableHead>
                  <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const userAttendance = (attendanceRecords || []).filter(
                      record => record.employee_id === user.id && (!selectedMonth || record.date.startsWith(selectedMonth))
                    );
                    const presentDays = userAttendance.filter(r => r.status === 'Present').length;
                    const calculatedSalary = calculateSalary(user.role, userAttendance);

                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-700">{user.name}</TableCell>
                        <TableCell className="text-xs font-medium uppercase text-slate-500">{user.role}</TableCell>
                        <TableCell className="font-black text-indigo-600">{presentDays}</TableCell>
                        <TableCell className="font-bold text-emerald-600">Rs. {calculatedSalary.toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="sm" className="font-bold text-indigo-600" onClick={() => toast({ title: 'Coming Soon', description: 'Detailed breakdown is being developed.'})}>
                                View Details
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic font-medium">
                            No employees found or data is loading...
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}