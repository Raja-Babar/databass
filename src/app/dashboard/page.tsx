'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Briefcase, DollarSign, Users, Clock, 
  FilePlus, Edit, MoreHorizontal, CalendarOff, 
  ChevronDown, ChevronUp, Wallet, FileText 
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { scanningProgressRecords as scanningProgressRecordsJSON } from '@/lib/placeholder-data';

// Types
type ScanningRecord = {
  book_id: string;
  title: string;
  status: string;
  scanner: string | null;
  qc_by: string | null;
  updated_at: string;
};

// Helpers
const getStatusClasses = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-primary text-primary-foreground hover:bg-primary/80';
    case 'uploading': return 'bg-[hsl(var(--chart-2))] text-black hover:bg-[hsl(var(--chart-2))]';
    case 'pdf-qc': return 'bg-primary/80 text-primary-foreground hover:bg-primary/70';
    case 'scanning-qc': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'pending': return 'bg-yellow-500 text-black hover:bg-yellow-500/80';
    default: return 'text-foreground border-foreground/50';
  }
};

const statusOptions = ["Pending", "Scanning", "Scanning-QC", "Page Cleaning+Cropping", "PDF-QC", "Uploading", "Completed"];

// --- MAIN PAGE COMPONENT ---
export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) setDbUser(data);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const user = dbUser || authUser;

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground">Logged in as: <Badge variant="secondary">{user.role}</Badge></p>
      </div>

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

// --- ADMIN DASHBOARD ---
function AdminDashboard() {
  const { getUsers } = useAuth();
  const { toast } = useToast();
  const totalEmployees = getUsers()?.filter(u => u.role !== 'Admin').length || 0;
  
  const [scanningRecords, setScanningRecords] = useState<ScanningRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('scanningProgressRecords');
      return stored ? JSON.parse(stored) : JSON.parse(scanningProgressRecordsJSON);
    } catch (e) {
      return JSON.parse(scanningProgressRecordsJSON);
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScanningRecord | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedStatus, setEditedStatus] = useState('');

  const sortedRecords = useMemo(() => {
    return [...scanningRecords].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [scanningRecords]);

  const visibleRecords = isExpanded ? sortedRecords : sortedRecords.slice(0, 5);

  const stats = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: Users, href: '/dashboard/user-management', subtext: "+5.1% from last month" },
    { title: 'Projects Ongoing', value: '5', icon: Briefcase, subtext: "+1 from last month" },
    { title: 'Salaries Record', value: 'View', icon: DollarSign, href: '/dashboard/salaries', bold: true },
    { title: 'Digitization Progress', value: '75%', icon: BarChart, href: '/dashboard/scanning', subtext: "+2.1% from last month" },
  ];

  const handleUpdateRecord = () => {
    if (selectedRecord && editedTitle) {
      const updated = scanningRecords.map(rec =>
        rec.book_id === selectedRecord.book_id ? { ...rec, title: editedTitle, status: editedStatus, updated_at: new Date().toISOString() } : rec
      );
      setScanningRecords(updated);
      localStorage.setItem('scanningProgressRecords', JSON.stringify(updated));
      toast({ title: 'Success', description: 'Record updated successfully.' });
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link href={stat.href || '#'} key={stat.title}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Digitization Status</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Scanner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record.book_id}>
                  <TableCell className="font-medium">{record.title}</TableCell>
                  <TableCell><Badge className={cn(getStatusClasses(record.status))}>{record.status}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">{record.scanner || 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedRecord(record);
                      setEditedTitle(record.title);
                      setEditedStatus(record.status);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'See Less' : 'See More'}
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={setEditedStatus} defaultValue={editedStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateRecord}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- EMPLOYEE DASHBOARD ---
function EmployeeDashboard() {
  const { user, attendanceRecords, updateAttendance, employeeReports, requiredIp } = useAuth();
  const { toast } = useToast();
  const [currentIp, setCurrentIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setCurrentIp(data.ip))
      .catch(() => console.error("IP Fetch Error"));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const record = attendanceRecords?.find(r => r.employeeId === user?.id && r.date === today);

  const canClockIn = !requiredIp || currentIp === requiredIp;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>My Attendance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!!record?.timeIn || !canClockIn} onClick={() => {
              updateAttendance(user!.id, { clockIn: true });
              toast({ title: "Clocked In" });
            }}>Clock In</Button>
            <Button variant="outline" disabled={!record?.timeIn || !!record?.timeOut} onClick={() => {
              updateAttendance(user!.id, { clockOut: true });
              toast({ title: "Clocked Out" });
            }}>Clock Out</Button>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex justify-between text-sm">
              <span>Time In: <b>{record?.timeIn || '--:--'}</b></span>
              <span>Status: <Badge>{record?.status || 'Pending'}</Badge></span>
            </div>
          </div>
          {!canClockIn && <p className="text-xs text-destructive text-center italic">Wrong Network (Required: {requiredIp})</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <Link href="/dashboard/employee-reports">
            <Button className="w-full"><FilePlus className="mr-2 h-4 w-4" /> Create New Report</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// --- ACCOUNTS DASHBOARD ---
function AccountsDashboard() {
  const links = [
    { title: 'Salaries', icon: DollarSign, href: '/dashboard/salaries' },
    { title: 'Petty Cash', icon: Wallet, href: '/dashboard/petty-cash' },
    { title: 'Correspondence', icon: FileText, href: '/dashboard/correspondence' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {links.map(link => (
        <Link href={link.href} key={link.title}>
          <Card className="hover:bg-accent transition-colors">
            <CardHeader className="flex flex-row items-center gap-4">
              <link.icon className="h-8 w-8 text-primary" />
              <CardTitle>{link.title}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}