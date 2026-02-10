'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance, AttendanceRecord } from '@/hooks/itsection/use-attendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Clock, CalendarOff, Search, Trash2, Edit2, Check, X, MessageSquare } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth(); 
  const { attendanceRecords, updateAttendance, updateAttendanceRecord, deleteAttendanceRecord } = useAttendance(); 

  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  
  // Leave Modal States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  const isEmployee = user?.role === 'I.T & Scanning-Employee' || user?.role === 'Library-Employee';
  const isAdmin = user?.role === 'Admin';

  // Get Today's Record using Karachi Date Logic
  const todaysRecord = useMemo(() => {
    if (!user) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
    return attendanceRecords.find(r => r.employeeId === user.id && r.date === today);
  }, [attendanceRecords, user]);

  const hasClockedIn = !!(todaysRecord?.timeIn && todaysRecord.timeIn !== '--:--');
  const hasClockedOut = !!(todaysRecord?.timeOut && todaysRecord.timeOut !== '--:--');
  const isOnLeave = todaysRecord?.status === 'Leave';

  const filteredRecords = useMemo(() => {
    let records = attendanceRecords;
    if (isEmployee) records = records.filter(r => r.employeeId === user?.id);
    if (searchQuery) records = records.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, searchQuery, isEmployee, user]);

  const handleMarkLeave = async () => {
    if (!leaveReason.trim()) return;
    await updateAttendance(user!.id, { markLeave: true, reason: leaveReason });
    setLeaveReason('');
    setIsLeaveModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      
      {/* Employee Quick Actions */}
      {isEmployee && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Today's Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button onClick={() => updateAttendance(user!.id, { clockIn: true })} disabled={hasClockedIn || isOnLeave} className="w-full">Clock In</Button>
              <Button onClick={() => updateAttendance(user!.id, { clockOut: true })} variant="outline" disabled={!hasClockedIn || hasClockedOut || isOnLeave} className="w-full">Clock Out</Button>
              <Button onClick={() => setIsLeaveModalOpen(true)} variant="secondary" disabled={hasClockedIn || isOnLeave} className="w-full">
                <CalendarOff className="mr-2 h-4 w-4" /> Request Leave
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Request Modal */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Please provide a reason for your leave request today.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter reason (e.g., Sick leave, Family emergency...)" 
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkLeave} disabled={!leaveReason.trim()}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{isAdmin ? 'Organization Logs' : 'My History'}</CardTitle>
            </div>
            {isAdmin && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>In/Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => (
                  <TableRow key={`${record.employeeId}-${record.date}`}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.timeIn || '--'} / {record.timeOut || '--'}</TableCell>
                    <TableCell>
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-700' : record.status === 'Leave' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate italic text-muted-foreground text-sm">
                      {record.status === 'Leave' ? record.reason || 'No reason' : '-'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                         <Button size="icon" variant="ghost" onClick={() => deleteAttendanceRecord(record.employeeId, record.date)} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}