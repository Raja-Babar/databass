'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance, AttendanceRecord } from '@/hooks/use-attendance'; // Import the new hook
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// A Map to store salaries, using employee_id as the key
const salaries = new Map<string, number>([
    ['I.T & Scanning-Employee', 25000],
    ['Library-Employee', 22000],
]);

export default function SalariesPage() {
  const { users } = useAuth(); // Get all users from useAuth
  const { attendanceRecords, updateAttendanceRecord, deleteAttendanceRecord } = useAttendance(); // Use the new hook for attendance data
  
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState('');

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        user.role !== 'Admin' // Exclude admins from salary calculations
    );
  }, [users, searchQuery]);

  const calculateSalary = (userRole: string, attendance: AttendanceRecord[]) => {
    const baseSalary = salaries.get(userRole) || 0;
    const presentDays = attendance.filter(r => r.status === 'Present').length;
    
    // Simple calculation: (base / 30) * days_present. Adjust as needed.
    return (baseSalary / 30) * presentDays;
  };

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    attendanceRecords.forEach(record => {
        const month = record.date.substring(0, 7); // YYYY-MM
        months.add(month);
    });
    return Array.from(months).sort().reverse(); // Sort descending
  }, [attendanceRecords]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Salaries & Attendance Management</CardTitle>
          <CardDescription>
            View and manage employee salaries based on their monthly attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input 
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-1/3"
            />
            <Select onValueChange={handleMonthChange} value={selectedMonth}>
                <SelectTrigger className="md:w-1/4">
                    <SelectValue placeholder="Select a Month" />
                </SelectTrigger>
                <SelectContent>
                    {allMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Present Days</TableHead>
                <TableHead>Calculated Salary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const userAttendance = attendanceRecords.filter(
                  record => record.employee_id === user.id && (!selectedMonth || record.date.startsWith(selectedMonth))
                );
                const presentDays = userAttendance.filter(r => r.status === 'Present').length;
                const calculatedSalary = calculateSalary(user.role, userAttendance);

                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{presentDays}</TableCell>
                    <TableCell>Rs. {calculatedSalary.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Action not implemented', description: 'Detailed view is coming soon.'})}>
                            View Details
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
