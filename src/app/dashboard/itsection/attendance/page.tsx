'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/itsection/use-attendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Clock, CalendarOff, History, CheckCircle2 } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth(); 
  // Hook se wahi functions lein jo humne user ke liye banaye hain
  const { attendanceRecords, updateAttendance, loading } = useAttendance(); 

  // Leave Modal States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  // Get Today's Record logic
  const todaysRecord = useMemo(() => {
    if (!user) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
    return attendanceRecords.find(r => r.date === today);
  }, [attendanceRecords, user]);

  const hasClockedIn = !!todaysRecord?.timeIn;
  const hasClockedOut = !!todaysRecord?.timeOut;
  const isOnLeave = todaysRecord?.status === 'Leave';

  const handleMarkLeave = async () => {
    if (!leaveReason.trim()) return;
    await updateAttendance({ markLeave: true, reason: leaveReason });
    setLeaveReason('');
    setIsLeaveModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Dashboard</h1>
        <p className="text-muted-foreground text-sm">Mark your daily presence and view history.</p>
      </div>

      {/* --- Quick Actions Card --- */}
      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> 
            Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
          <CardDescription>Actions are disabled once marked for the day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => updateAttendance({ clockIn: true })} 
              disabled={hasClockedIn || isOnLeave || loading} 
              className="w-full h-11"
            >
              {hasClockedIn ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
              {hasClockedIn ? `In at ${todaysRecord.timeIn}` : 'Clock In'}
            </Button>

            <Button 
              onClick={() => updateAttendance({ clockOut: true })} 
              variant="outline" 
              disabled={!hasClockedIn || hasClockedOut || isOnLeave || loading} 
              className="w-full h-11"
            >
              {hasClockedOut ? `Out at ${todaysRecord.timeOut}` : 'Clock Out'}
            </Button>

            <Button 
              onClick={() => setIsLeaveModalOpen(true)} 
              variant="secondary" 
              disabled={hasClockedIn || isOnLeave || loading} 
              className="w-full h-11"
            >
              <CalendarOff className="mr-2 h-4 w-4" /> 
              {isOnLeave ? 'On Leave' : 'Apply Leave'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- History Table Section --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" /> My Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map(record => (
                    <TableRow key={record.date}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.timeIn || '--:--'}</TableCell>
                      <TableCell>{record.timeOut || '--:--'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'Present' ? 'bg-green-100 text-green-700' : 
                          record.status === 'Leave' ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate italic text-muted-foreground text-sm">
                        {record.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- Leave Request Dialog --- */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Your status will be marked as "Leave" for today ({new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())}).</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason (e.g. Urgent work, health issue...)" 
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkLeave} disabled={!leaveReason.trim()}>Confirm Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}