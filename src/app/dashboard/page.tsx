'use client';

import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  FileText, 
  View, 
  Wallet, 
  ChevronUp, 
  ChevronDown,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const getScanningStatusClasses = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-emerald-500 text-white hover:bg-emerald-600';
    case 'uploading': return 'bg-blue-500 text-white hover:bg-blue-600';
    case 'scanning': return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'pdf-qc': return 'bg-indigo-500 text-white hover:bg-indigo-600';
    case 'scanning-qc': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // FIX: Redirection path updated to /itsection
    if (!isLoading && user && user.role !== 'Admin' && user.role !== 'Accounts') {
      router.replace('/dashboard/itsection');
    }
  }, [user, isLoading, router]);

  // FIX: Loading state handling to prevent stuck screen
  if (isLoading && !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {user.role === 'Admin' ? (
        <AdminDashboard />
      ) : user.role === 'Accounts' ? (
        <AccountsDashboard />
      ) : (
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground italic">
          Redirecting to your workspace...
        </div>
      )}
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard() {
  const { users, scanningRecords, employeeReports } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const RECORDS_TO_SHOW = 5;

  const totalEmployees = users?.filter(u => u.role !== 'Admin').length || 0;
  const projectsOngoing = scanningRecords?.length || 0;
  
  // Adjusted report logic for safer date check
  const reportsToday = employeeReports?.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.submitted_date === today;
  }).length || 0;

  const sortedScanningRecords = useMemo(() => {
    if (!scanningRecords) return [];
    return [...scanningRecords].sort((a, b) => 
      new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime()
    );
  }, [scanningRecords]);

  const visibleScanningActivity = isExpanded 
    ? sortedScanningRecords 
    : sortedScanningRecords.slice(0, RECORDS_TO_SHOW);

  const hasMoreRecords = sortedScanningRecords.length > RECORDS_TO_SHOW;

  const stats = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: Users, href: '/dashboard/user-management' },
    { title: 'Projects Ongoing', value: projectsOngoing.toString(), icon: Briefcase, href: '/dashboard/scanning' },
    // Updated path to itsection for reports
    { title: 'Reports Today', value: reportsToday.toString(), icon: FileText, href: '/dashboard/itsection/employee-reports' },
    { title: 'Salaries & Attendance', value: 'Manage', icon: DollarSign, href: '/dashboard/salaries' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Admin Dashboard</h1>
        <p className="text-slate-500 font-medium">Overview of the entire digitization workflow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase text-slate-400">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-800">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold">Recent Digitization Activity</CardTitle>
          <CardDescription>Latest updates in the scanning and QC pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="font-bold">Book Title</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Assigned To</TableHead>
                <TableHead className="font-bold">Last Updated</TableHead>
                <TableHead className="text-right font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleScanningActivity.length > 0 ? (
                visibleScanningActivity.map((record) => (
                  <TableRow key={record.book_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold truncate max-w-[200px] text-slate-700">
                      {record.title_english || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-bold text-[10px] uppercase border-none px-2 py-0.5", getScanningStatusClasses(record.status))}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{record.assigned_to || 'Unassigned'}</TableCell>
                    <TableCell className="text-xs text-slate-400 font-medium">
                      {new Date(record.last_edited_time).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/dashboard/scanning">
                        <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600">
                          <View className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic font-medium">
                    No active scanning records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {hasMoreRecords && (
          <CardFooter className="justify-center border-t bg-slate-50/30 py-2">
            <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Show Less' : 'Show More Activity'}
              {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// --- ACCOUNTS DASHBOARD COMPONENT ---
function AccountsDashboard() {
  const accountStats = [
    { title: 'Salaries Record', value: 'View', icon: DollarSign, href: '/dashboard/salaries' },
    { title: 'Petty Cash', value: 'Manage', icon: Wallet, href: '/dashboard/petty-cash' },
    { title: 'Correspondence', value: 'View', icon: FileText, href: '/dashboard/correspondence' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Accounts Dashboard</h1>
        <p className="text-slate-500 font-medium">Manage financial and administrative records.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accountStats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase text-slate-400">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-800">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}