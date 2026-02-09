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
  ChevronDown 
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

// Helper for Status Badge Styling
const getScanningStatusClasses = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-primary text-primary-foreground hover:bg-primary/80';
    case 'uploading': return 'bg-[hsl(var(--chart-2))] text-black hover:bg-[hsl(var(--chart-2))]';
    case 'scanning': return 'text-foreground border-foreground/50';
    case 'pdf-qc': return 'bg-primary/80 text-primary-foreground hover:bg-primary/70';
    case 'scanning-qc': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'page cleaning+cropping': return 'text-foreground border-foreground/50';
    case 'pending': return 'bg-yellow-500 text-black hover:bg-yellow-500/80';
    default: return 'text-foreground border-foreground/50';
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Agar user Admin ya Accounts nahi hai, to use Employee page par bhejein
    if (user && user.role !== 'Admin' && user.role !== 'Accounts') {
      router.replace('/dashboard/employee');
    }
  }, [user, router]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading session...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {user.role === 'Admin' ? (
        <AdminDashboard />
      ) : user.role === 'Accounts' ? (
        <AccountsDashboard />
      ) : (
        <div className="flex h-screen items-center justify-center text-muted-foreground">
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

  // Stats Logic
  const totalEmployees = users?.filter(u => u.role !== 'Admin').length || 0;
  const projectsOngoing = scanningRecords?.length || 0;
  const reportsToday = employeeReports?.filter(r => 
    new Date(r.submitted_date).toDateString() === new Date().toDateString()
  ).length || 0;

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
    { title: 'Reports Today', value: reportsToday.toString(), icon: FileText, href: '/dashboard/employee-reports' },
    { title: 'Salaries & Attendance', value: 'Manage', icon: DollarSign, href: '/dashboard/salaries' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the entire digitization workflow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:border-primary transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Digitization Activity</CardTitle>
          <CardDescription>Latest updates in the scanning and QC pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleScanningActivity.length > 0 ? (
                visibleScanningActivity.map((record) => (
                  <TableRow key={record.book_id}>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {record.title_english || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(getScanningStatusClasses(record.status))}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.assigned_to || 'Unassigned'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.last_edited_time).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/dashboard/scanning">
                        <Button variant="ghost" size="sm">
                          <View className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No active scanning records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {hasMoreRecords && (
          <CardFooter className="justify-center border-t py-3">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
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
        <h1 className="text-3xl font-bold tracking-tight">Accounts Dashboard</h1>
        <p className="text-muted-foreground">Manage financial and administrative records.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accountStats.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:border-primary transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}