// src/app/dashboard/lib-attendance/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Search, Globe, CalendarOff, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceRecord } from '@/context/auth-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Not Marked';

const getStatusClasses = (status: AttendanceStatus) => {
  switch (status) {
    case 'Present':
      return 'bg-green-500 text-white hover:bg-green-500/80';
    case 'Absent':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'Leave':
      return 'bg-primary text-primary-foreground hover:bg-primary/80';
    default:
      return 'border-border';
  }
};

export default function LibAttendancePage() {
  const { user, attendanceRecords, updateAttendanceRecord, deleteAttendanceRecord, getUsers, requiredIp, setRequiredIp, updateAttendance } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editedTimeIn, setEditedTimeIn] = useState('');
  const [editedTimeOut, setEditedTimeOut] = useState('');
  const [editedStatus, setEditedStatus] = useState<AttendanceStatus>('Not Marked');
  
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);
  const [ipInput, setIpInput] = useState(requiredIp);

  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
  const RECORDS_TO_SHOW = 5;

  const isEmployee = user?.role === 'Library-Employee';

  useEffect(() => {
    setIpInput(requiredIp);
  }, [requiredIp]);

  useEffect(() => {
    if (isEmployee) {
      fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => setCurrentIp(data.ip))
        .catch(() => setIpError('Could not fetch IP address. Please check your network connection.'));
    }
  }, [isEmployee]);

  const todaysRecord = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(r => r.employeeId === user?.id && r.date === today);
  }, [attendanceRecords, user]);

  const canClockIn = useMemo(() => {
    if (!isEmployee) return false;
    if (ipError) return false;
    if (todaysRecord?.status === 'Leave') return false;
    if (!requiredIp || !currentIp) return true; // Allow if no restriction or IP not fetched yet
    return currentIp === requiredIp;
  }, [isEmployee, requiredIp, currentIp, ipError, todaysRecord]);

  const hasClockedIn = todaysRecord?.timeIn && todaysRecord.timeIn !== '--:--';
  const hasClockedOut = todaysRecord?.timeOut && todaysRecord.timeOut !== '--:--';
  const isOnLeave = todaysRecord?.status === 'Leave';

  const userAttendanceRecords = useMemo(() => {
    const allUsers = getUsers();
    const adminIds = allUsers.filter(u => u.role === 'Admin').map(u => u.id);
    const nonLibraryRoles = ['I.T & Scanning-Employee'];
    const nonLibraryUserIds = allUsers.filter(u => nonLibraryRoles.includes(u.role)).map(u => u.id);


    const records = attendanceRecords.filter(r => !adminIds.includes(r.employeeId) && !nonLibraryUserIds.includes(r.employeeId));

    if (isEmployee && user) {
      return records.filter(r => r.employeeId === user.id);
    }
    return records;
  }, [isEmployee, user, attendanceRecords, getUsers]);

  const recordsByEmployee = useMemo(() => {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      
      const grouped: { [key: string]: { employeeId: string, employeeName: string, employeeAvatar?: string, records: AttendanceRecord[], summary: { Present: number, Absent: number, Leave: number } } } = {};
      const allUsers = getUsers().filter(u => u.role === 'Library-Employee');

      const usersToDisplay = isEmployee ? allUsers.filter(u => u.id === user?.id) : allUsers;

      usersToDisplay.forEach(emp => {
          const userRecordsForMonth = userAttendanceRecords.filter(r => {
              const recordDate = new Date(r.date + 'T00:00:00');
              return r.employeeId === emp.id && recordDate.getMonth() === month && recordDate.getFullYear() === year;
          });

          const summary = { Present: 0, Absent: 0, Leave: 0 };
          userRecordsForMonth.forEach(r => {
              if (r.status === 'Present') summary.Present++;
              else if (r.status === 'Absent') summary.Absent++;
              else if (r.status === 'Leave') summary.Leave++;
          });

          grouped[emp.id] = {
              employeeId: emp.id,
              employeeName: emp.name,
              employeeAvatar: emp.avatar,
              records: userRecordsForMonth.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
              summary: summary
          };
      });

      return Object.values(grouped).filter(employeeData =>
          employeeData.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [selectedDate, userAttendanceRecords, isEmployee, user, getUsers, searchTerm]);


  const selectedMonthFormatted = selectedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const handleExportAllPDF = () => {
    const doc = new jsPDF();
    doc.text(`Daily Attendance Report - ${selectedMonthFormatted}`, 14, 16);

    let finalY = 22;

    recordsByEmployee.forEach(({ employeeName, records, summary }) => {
        doc.setFontSize(12);
        doc.text(`Employee: ${employeeName}`, 14, finalY);
        finalY += 6;

        const summaryText = `Summary: ${summary.Present} Present, ${summary.Absent} Absent, ${summary.Leave} on Leave`;
        doc.setFontSize(10);
        doc.text(summaryText, 14, finalY);
        finalY += 5;

        (doc as any).autoTable({
            head: [['Date', 'Time In', 'Time Out', 'Status']],
            body: records.map(r => [
                new Date(r.date + 'T00:00:00').toLocaleDateString(),
                r.timeIn,
                r.timeOut,
                r.status
            ]),
            startY: finalY,
            didDrawPage: function (data: any) {
                if (data.pageNumber > 1) {
                    finalY = 20;
                }
            },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`lib_attendance_report_all_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.pdf`);
  };

  const handleExportSinglePDF = (employeeData: { employeeName: string; records: AttendanceRecord[]; summary: { Present: number; Absent: number; Leave: number; }; }) => {
    const { employeeName, records, summary } = employeeData;
    const doc = new jsPDF();
    doc.text(`Daily Attendance Report - ${selectedMonthFormatted}`, 14, 16);

    let finalY = 22;

    doc.setFontSize(12);
    doc.text(`Employee: ${employeeName}`, 14, finalY);
    finalY += 6;

    const summaryText = `Summary: ${summary.Present} Present, ${summary.Absent} Absent, ${summary.Leave} on Leave`;
    doc.setFontSize(10);
    doc.text(summaryText, 14, finalY);
    finalY += 5;

    (doc as any).autoTable({
        head: [['Date', 'Time In', 'Time Out', 'Status']],
        body: records.map(r => [
            new Date(r.date + 'T00:00:00').toLocaleDateString(),
            r.timeIn,
            r.timeOut,
            r.status
        ]),
        startY: finalY,
    });
    
    doc.save(`lib_attendance_report_${employeeName.replace(' ', '_')}_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.pdf`);
  };
  
  const handleEditClick = (record: AttendanceRecord) => {
      setSelectedRecord(record);
      setEditedTimeIn(record.timeIn);
      setEditedTimeOut(record.timeOut);
      setEditedStatus(record.status as AttendanceStatus);
      setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = () => {
      if (selectedRecord) {
          updateAttendanceRecord(selectedRecord.employeeId, selectedRecord.date, {
              timeIn: editedTimeIn,
              timeOut: editedTimeOut,
              status: editedStatus,
          });
          toast({
              title: 'Record Updated',
              description: 'The attendance record has been successfully updated.',
          });
          setIsEditDialogOpen(false);
          setSelectedRecord(null);
      }
  };

  const handleDeleteRecord = (employeeId: string, date: string) => {
      deleteAttendanceRecord(employeeId, date);
      toast({
          title: 'Record Deleted',
          description: 'The attendance record has been successfully deleted.',
      });
  };

  const handleClockIn = () => {
    if (user && canClockIn) {
      updateAttendance(user.id, { clockIn: true });
      toast({ title: 'Clocked In', description: 'Your arrival time has been recorded.' });
    } else {
      toast({ variant: 'destructive', title: 'Clock-In Failed', description: `Your IP (${currentIp}) does not match the required IP (${requiredIp}).` });
    }
  };

  const handleClockOut = () => {
    if (user) {
      updateAttendance(user.id, { clockOut: true });
      toast({ title: 'Clocked Out', description: 'Your departure time has been recorded.' });
    }
  };
  
  const handleMarkLeave = () => {
    if (user) {
      updateAttendance(user.id, { markLeave: true });
      toast({
        title: "Leave Marked",
        description: "You have been marked as on leave for today.",
      });
    }
  };

  const handleSetIp = () => {
    setRequiredIp(ipInput);
    toast({ title: 'IP Address Set', description: `Attendance is now restricted to ${ipInput || 'any IP'}.` });
  };
  
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev =>
        prev.includes(employeeId)
            ? prev.filter(id => id !== employeeId)
            : [...prev, employeeId]
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Staff Attendance</h1>
          <p className="text-muted-foreground mt-2">
            Viewing records for <span className="font-semibold text-primary">{selectedMonthFormatted}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-col sm:flex-row">
            {!isEmployee && (
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employees..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
             <Button variant="outline" size="sm" onClick={handleExportAllPDF} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> Export All PDF
            </Button>
        </div>
      </div>
        {isEmployee && (
             <Card>
                <CardHeader>
                    <CardTitle>Today's Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4">
                    <div className="w-full space-y-4">
                    <div className="flex w-full gap-4">
                        <Button onClick={handleClockIn} className="w-full" disabled={hasClockedIn || !canClockIn}>
                            <Clock className="mr-2 h-4 w-4" />
                            Clock In
                        </Button>
                        <Button onClick={handleClockOut} className="w-full" variant="outline" disabled={!hasClockedIn || hasClockedOut || isOnLeave}>
                            <Clock className="mr-2 h-4 w-4" />
                            Clock Out
                        </Button>
                    </div>
                    <Button onClick={handleMarkLeave} className="w-full" variant="secondary" disabled={hasClockedIn || isOnLeave}>
                        <CalendarOff className="mr-2 h-4 w-4" />
                        Mark Leave
                    </Button>
                    {!canClockIn && currentIp && requiredIp && (
                        <p className="text-xs text-destructive text-center">
                        Clock-in disabled. Your IP ({currentIp}) does not match required IP ({requiredIp}).
                        </p>
                    )}
                    {ipError && (
                        <p className="text-xs text-destructive text-center">{ipError}</p>
                    )}
                    </div>
                </CardContent>
            </Card>
        )}

        {!isEmployee && (
            <Card>
                <CardHeader>
                    <CardTitle>Attendance IP Restriction</CardTitle>
                    <CardDescription>Set a specific IP address from which employees can clock in. Leave blank to allow clock-in from any IP.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Enter required IP address..." 
                            className="pl-8"
                            value={ipInput}
                            onChange={(e) => setIpInput(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSetIp}>Set IP</Button>
                </CardContent>
            </Card>
        )}

      <div className="grid gap-6">
        {recordsByEmployee.length > 0 ? (
            recordsByEmployee.map((employeeData) => {
              const isExpanded = expandedEmployees.includes(employeeData.employeeId);
              const visibleRecords = isExpanded ? employeeData.records : employeeData.records.slice(0, RECORDS_TO_SHOW);
              const hasMoreRecords = employeeData.records.length > RECORDS_TO_SHOW;

              const getInitials = (name: string) => {
                return name
                  .split(' ')
                  .map((n) => n[0])
                  .join('');
              };

              return (
                <Card key={employeeData.employeeId}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 hidden sm:flex">
                                <AvatarImage src={employeeData.employeeAvatar || `https://avatar.vercel.sh/${employeeData.employeeName}.png`} alt={employeeData.employeeName} />
                                <AvatarFallback>{getInitials(employeeData.employeeName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{employeeData.employeeName}'s Attendance</CardTitle>
                                <CardDescription>
                                    Daily records for <span className="font-semibold text-primary">{selectedMonthFormatted}</span>.
                                </CardDescription>
                            </div>
                        </div>
                         {!isEmployee && (
                             <Button variant="outline" size="sm" onClick={() => handleExportSinglePDF(employeeData)}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                         )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time In</TableHead>
                                    <TableHead>Time Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    {!isEmployee && <TableHead><span className="sr-only">Actions</span></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleRecords.map((record) => (
                                    <TableRow key={`${record.employeeId}-${record.date}`}>
                                        <TableCell>{new Date(record.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                        <TableCell>{record.timeIn}</TableCell>
                                        <TableCell>{record.timeOut}</TableCell>
                                        <TableCell>
                                            <Badge className={cn(getStatusClasses(record.status as AttendanceStatus))}>
                                                {record.status}
                                            </Badge>
                                        </TableCell>
                                        {!isEmployee && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEditClick(record)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                                                    <span className="text-destructive">Delete</span>
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete this attendance record? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteRecord(record.employeeId, record.date)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {hasMoreRecords && (
                            <div className="pt-4 text-center">
                                <Button variant="ghost" onClick={() => toggleEmployeeExpansion(employeeData.employeeId)}>
                                    {isExpanded ? 'See Less' : 'See More'}
                                    {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 pt-4">
                        <Separator />
                        <h3 className="font-semibold text-lg mt-2">Monthly Summary</h3>
                        <p className="text-sm text-muted-foreground space-x-4">
                            <span className="text-green-500">Present:</span>
                            <span className="font-semibold text-foreground">{employeeData.summary.Present}</span>
                            <span className="text-destructive">Absent:</span>
                            <span className="font-semibold text-foreground">{employeeData.summary.Absent}</span>
                            <span className="text-primary">On Leave:</span>
                            <span className="font-semibold text-foreground">{employeeData.summary.Leave}</span>
                        </p>
                    </CardFooter>
                </Card>
              )
            })
        ) : (
             <Card>
                <CardContent className="text-center text-muted-foreground pt-8">
                     No attendance records found for the selected period.
                </CardContent>
            </Card>
        )}
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Make changes to the record for <span className="font-semibold">{selectedRecord?.name}</span> on <span className="font-semibold">{selectedRecord ? new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString() : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeIn" className="text-right">Time In</Label>
              <Input id="timeIn" value={editedTimeIn} onChange={(e) => setEditedTimeIn(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="timeOut" className="text-right">Time Out</Label>
                <Input id="timeOut" value={editedTimeOut} onChange={(e) => setEditedTimeOut(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
               <Select onValueChange={(value) => setEditedStatus(value as AttendanceStatus)} defaultValue={editedStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Not Marked">Not Marked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleUpdateRecord}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
