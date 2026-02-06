
// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Briefcase, DollarSign, Users, Clock, FilePlus, Edit, MoreHorizontal, CalendarOff, ChevronDown, ChevronUp, Wallet, FileText } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';
import { scanningProgressRecords as scanningProgressRecordsJSON } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type ScanningRecord = {
  book_id: string;
  title: string;
  status: string;
  scanner: string | null;
  qc_by: string | null;
  updated_at: string;
};

const getStatusClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-primary text-primary-foreground hover:bg-primary/80';
    case 'uploading':
      return 'bg-[hsl(var(--chart-2))] text-black hover:bg-[hsl(var(--chart-2))]';
    case 'scanning':
      return 'text-foreground border-foreground/50';
    case 'pdf-qc':
      return 'bg-primary/80 text-primary-foreground hover:bg-primary/70';
    case 'scanning-qc':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'page cleaning+cropping':
       return 'text-foreground border-foreground/50';
    case 'pending':
        return 'bg-yellow-500 text-black hover:bg-yellow-500/80';
    default:
      return 'text-foreground border-foreground/50';
  }
};

const statusOptions = [
    "Pending",
    "Scanning",
    "Scanning-QC",
    "Page Cleaning+Cropping",
    "PDF-QC",
    "Uploading",
    "Completed"
];


export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
      {user.role === 'Admin' ? (
        <AdminDashboard />
      ) : user.role === 'Accounts' ? (
        <AccountsDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}

const getStageBadgeClass = (stage: string) => {
    switch (stage.toLowerCase()) {
        case 'completed':
            return 'bg-green-600 text-white';
        case 'scanning':
            return 'bg-blue-500 text-white';
        case 'scanning q-c':
            return 'bg-yellow-500 text-black';
        case 'pdf pages':
            return 'bg-purple-500 text-white';
        case 'pdf q-c':
            return 'bg-orange-500 text-white';
        case 'pdf uploading':
            return 'bg-teal-500 text-white';
        case 'leave':
            return 'bg-gray-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};


function AdminDashboard() {
  const { getUsers } = useAuth();
  const { toast } = useToast();
  const totalEmployees = getUsers().filter(u => u.role !== 'Admin').length;
  const [scanningRecords, setScanningRecords] = useState<ScanningRecord[]>(() => {
    try {
        const storedRecords = localStorage.getItem('scanningProgressRecords');
        return storedRecords ? JSON.parse(storedRecords) : JSON.parse(scanningProgressRecordsJSON);
    } catch (e) {
        return JSON.parse(scanningProgressRecordsJSON);
    }
  });

  useEffect(() => {
    localStorage.setItem('scanningProgressRecords', JSON.stringify(scanningRecords));
  }, [scanningRecords]);

  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScanningRecord | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedStatus, setEditedStatus] = useState('');

  const [isExpanded, setIsExpanded] = useState(false);
  const RECORDS_TO_SHOW = 5;

  const sortedScanningRecords = useMemo(() => {
    return scanningRecords
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [scanningRecords]);

  const visibleScanningActivity = useMemo(() => {
    if (isExpanded) {
      return sortedScanningRecords;
    }
    return sortedScanningRecords.slice(0, RECORDS_TO_SHOW);
  }, [isExpanded, sortedScanningRecords]);

  const hasMoreRecords = sortedScanningRecords.length > RECORDS_TO_SHOW;

  const stats = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: Users, href: '/dashboard/user-management', subtext: "+5.1% from last month" },
    { title: 'Projects Ongoing', value: '5', icon: Briefcase, subtext: "+1 from last month" },
    { title: 'Salaries Record', value: null, icon: DollarSign, href: '/dashboard/salaries', bold: true },
    { title: 'Digitization Progress', value: '75%', icon: BarChart, href: '/dashboard/scanning', subtext: "+2.1% from last month" },
  ];

  const handleEditClick = (record: ScanningRecord) => {
    setSelectedRecord(record);
    setEditedTitle(record.title);
    setEditedStatus(record.status);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecord = () => {
    if (selectedRecord && editedTitle) {
      setScanningRecords(prevRecords =>
        prevRecords.map(rec =>
          rec.book_id === selectedRecord.book_id ? { ...rec, title: editedTitle, status: editedStatus, updated_at: new Date().toISOString() } : rec
        )
      );
      toast({
        title: 'Record Updated',
        description: 'The book record has been successfully updated.',
      });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
    }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Admin Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
            const cardContent = (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${stat.bold ? 'font-bold' : ''}`}>{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stat.value || <>&nbsp;</>}</div>
                    <p className="text-xs text-muted-foreground h-4">{stat.subtext || ''}</p>
                    </CardContent>
                </Card>
            );

            if (stat.href) {
                return (
                    <Link href={stat.href} key={stat.title}>
                       {cardContent}
                    </Link>
                )
            }
            return <div key={stat.title}>{cardContent}</div>;
        })}
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Digitization Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Scanner</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                 <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleScanningActivity.length > 0 ? (
                visibleScanningActivity.map((record) => (
                  <TableRow key={record.book_id}>
                    <TableCell className="font-medium">{record.title}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusClasses(record.status))}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{record.scanner || 'N/A'}</TableCell>
                     <TableCell className="hidden md:table-cell">{new Date(record.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(record)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent scanning activity.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {hasMoreRecords && (
            <CardFooter className="justify-center border-t pt-4">
                <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'See Less' : 'See More'}
                    {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
            </CardFooter>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Book Record</DialogTitle>
            <DialogDescription>
              Make changes to the book record here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
               <Select onValueChange={(value) => setEditedStatus(value)} defaultValue={editedStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
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

function EmployeeDashboard() {
  const { user, attendanceRecords, updateAttendance, employeeReports, requiredIp } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const todaysRecord = attendanceRecords.find(r => r.employeeId === user?.id && r.date === today);

  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setCurrentIp(data.ip))
      .catch(() => setIpError('Could not fetch IP address.'));
  }, []);

  const canClockIn = useMemo(() => {
    if (ipError) return false;
    if (!requiredIp || !currentIp) return true; // Allow if no restriction or IP not fetched yet
    return currentIp === requiredIp;
  }, [requiredIp, currentIp, ipError]);

  const timeIn = todaysRecord?.timeIn || '--:--';
  const timeOut = todaysRecord?.timeOut || '--:--';
  
  const hasClockedIn = timeIn !== '--:--';
  const hasClockedOut = timeOut !== '--:--';
  const isOnLeave = todaysRecord?.status === 'Leave';

  const userReports = useMemo(() => {
    if (user?.role === 'I.T & Scanning-Employee') {
        return employeeReports.filter(report => report.employeeId === user.id).slice(0, 5); // Show latest 5
    }
    return [];
  }, [user, employeeReports]);


  const handleClockIn = () => {
    if (user) {
      if (canClockIn) {
        updateAttendance(user.id, { clockIn: true });
        toast({
          title: "Clocked In",
          description: "Your arrival time has been recorded.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Clock-In Failed",
          description: `Your IP (${currentIp}) does not match the required IP.`,
        });
      }
    }
  };
  
  const handleClockOut = () => {
    if (user) {
      updateAttendance(user.id, { clockOut: true });
       toast({
        title: "Clocked Out",
        description: "Your departure time has been recorded.",
      });
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


  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance</CardTitle>
            <p className="text-sm text-muted-foreground">Clock in and out for today.</p>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <div className="w-full space-y-4">
              <div className="flex w-full gap-4">
                <Button onClick={handleClockIn} className="w-full" disabled={hasClockedIn || !canClockIn || isOnLeave}>
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
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                      <TableCell>{timeIn}</TableCell>
                      <TableCell>{timeOut}</TableCell>
                       <TableCell>
                        <Badge variant={todaysRecord?.status === 'Present' ? 'default' : todaysRecord?.status === 'Leave' ? 'secondary' : 'outline'}>
                          {todaysRecord?.status || 'Not Marked'}
                        </Badge>
                       </TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Report</CardTitle>
            <p className="text-sm text-muted-foreground">Start a new report submission.</p>
          </CardHeader>
          <CardContent>
              <Link href="/dashboard/employee-reports">
                  <Button className="w-full">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Create New Report
                  </Button>
              </Link>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
           <p className="text-sm text-muted-foreground">A list of your assigned reports and their current stages.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userReports.length > 0 ? (
                userReports.map((task) => {
                  const attendanceRecord = attendanceRecords.find(
                    (r) =>
                      r.employeeId === user?.id &&
                      r.date === task.submittedDate
                  );
                  const isOnLeaveForTask = attendanceRecord?.status === 'Leave';
                  
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{`${task.type} - ${task.quantity}`}</TableCell>
                      <TableCell>
                        <Badge className={cn(getStageBadgeClass(isOnLeaveForTask ? 'Leave' : task.stage))}>
                          {isOnLeaveForTask ? 'Leave' : task.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(task.submittedDate + 'T00:00:00').toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    You have no assigned tasks.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsDashboard() {
    const adminStats = [
        { title: 'Salaries Record', value: null, icon: DollarSign, href: '/dashboard/salaries', bold: true },
        { title: 'Petty Cash', value: null, icon: Wallet, href: '/dashboard/petty-cash', bold: true },
        { title: 'Correspondence', value: null, icon: FileText, href: '/dashboard/correspondence', bold: true },
    ];
  
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Administration Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {adminStats.map((stat) => {
              const cardContent = (
                   <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className={`text-sm font-medium ${stat.bold ? 'font-bold' : ''}`}>{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                         <div className="text-2xl font-bold">{stat.value || 'View'}</div>
                      </CardContent>
                  </Card>
              );
  
              if (stat.href) {
                  return (
                      <Link href={stat.href} key={stat.title}>
                         {cardContent}
                      </Link>
                  )
              }
              return <div key={stat.title}>{cardContent}</div>;
          })}
        </div>
      </div>
    );
  }
