'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/use-attendance';
import { useReports } from '@/hooks/use-reports'; // Import the new hook
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, FilePlus } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

const getReportStageBadgeClass = (stage: string) => {
    switch (stage?.toLowerCase()) {
        case 'completed': return 'bg-green-600 text-white';
        case 'scanning': return 'bg-blue-500 text-white';
        case 'scanning q-c': return 'bg-yellow-500 text-black';
        case 'pdf pages': return 'bg-purple-500 text-white';
        case 'pdf q-c': return 'bg-orange-500 text-white';
        case 'pdf uploading': return 'bg-teal-500 text-white';
        case 'leave': return 'bg-gray-500 text-white';
        default: return 'bg-gray-500 text-white';
    }
};

export default function EmployeeDashboardPage() {
  const { user, requiredIp } = useAuth(); // Get user and IP from useAuth
  const { attendanceRecords, updateAttendance } = useAttendance();
  const { employeeReports } = useReports(); // Use the new hook for reports
  const { toast } = useToast();
  
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setCurrentIp(data.ip))
      .catch(() => setIpError('Could not fetch your IP address.'));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysRecord = attendanceRecords.find(r => r.employee_id === user?.id && r.date === today);

  const canClockIn = useMemo(() => {
    if (ipError) return false;
    return !requiredIp || requiredIp === '0.0.0.0' || currentIp === requiredIp;
  }, [requiredIp, currentIp, ipError]);

  const timeIn = todaysRecord?.time_in || '--:--';
  const timeOut = todaysRecord?.time_out || '--:--';
  const hasClockedIn = timeIn !== '--:--';
  const hasClockedOut = timeOut !== '--:--';
  const isOnLeave = todaysRecord?.status === 'Leave';

  const userReports = useMemo(() => {
    if (!user || !employeeReports) return [];
    return employeeReports.filter(report => report.employee_id === user.id).slice(0, 5);
  }, [user, employeeReports]);

  const handleClockIn = async () => {
    if (!user) return;
    if (!canClockIn) {
      toast({ variant: "destructive", title: "Clock-In Failed: IP Mismatch", description: `Your IP (${currentIp}) does not match the required IP.` });
      return;
    }
    await updateAttendance(user.id, { clockIn: true });
  };

  const handleClockOut = async () => {
    if (!user) return;
    await updateAttendance(user.id, { clockOut: true });
  };
  
  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
       <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
       <p className="text-muted-foreground">Welcome, {user.name}! Here's your summary for today.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance</CardTitle>
            <CardDescription>Your clock-in/out status for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button className="w-full" onClick={handleClockIn} disabled={hasClockedIn || !canClockIn || isOnLeave}>
                <Clock className="mr-2 h-4 w-4"/> Clock In
              </Button>
              <Button className="w-full" variant="outline" onClick={handleClockOut} disabled={!hasClockedIn || hasClockedOut || isOnLeave}>
                <Clock className="mr-2 h-4 w-4"/> Clock Out
              </Button>
            </div>
            {ipError && <p className="text-xs text-destructive text-center">{ipError}</p>}
            {!canClockIn && currentIp && requiredIp !== '0.0.0.0' && (
                <p className="text-xs text-destructive text-center">
                    Clock-in disabled. IP does not match required setting.
                </p>
            )}
            <div className="border rounded-md p-2 text-center bg-muted/20">
               <p className="text-sm">Today's Status: <Badge variant={todaysRecord?.status === 'Present' ? 'default' : todaysRecord?.status === 'Leave' ? 'secondary' : 'outline'}>{todaysRecord?.status || 'Not Marked'}</Badge></p>
               <div className="grid grid-cols-2 mt-2">
                  <div><p className="text-xs">Time In</p><p className="font-mono text-lg">{timeIn}</p></div>
                  <div><p className="text-xs">Time Out</p><p className="font-mono text-lg">{timeOut}</p></div>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription className="text-sm text-muted-foreground my-2">Submit your daily digitization report here.</CardDescription>
            <Link href="/dashboard/employee-reports" className="w-full">
              <Button className="w-full"><FilePlus className="mr-2 h-4 w-4" /> Create New Report</Button>
            </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>My Recent Reports</CardTitle>
            <CardDescription>A list of your 5 most recent report submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Details</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userReports.length > 0 ? (
                userReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>{report.type} ({report.quantity})</TableCell>
                    <TableCell><Badge className={cn(getReportStageBadgeClass(report.stage))}>{report.stage}</Badge></TableCell>
                    <TableCell>{new Date(report.submitted_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No reports found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
