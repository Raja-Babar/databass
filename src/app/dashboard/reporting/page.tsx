// src/app/dashboard/reporting/page.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const reports = [
  {
    id: 'REP-001',
    name: 'Annual User Activity Report',
    description: 'A comprehensive summary of user logins and activity over the past year.',
    status: 'Generated',
    date: '2024-01-01',
  },
  {
    id: 'REP-002',
    name: 'Q2 Financial Summary',
    description: 'Quarterly report on petty cash and salary expenditures.',
    status: 'Generated',
    date: '2024-06-30',
  },
  {
    id: 'REP-003',
    name: 'Scanning Project Progress',
    description: 'Mid-year progress report for all book scanning projects.',
    status: 'Pending',
    date: '2024-07-31',
  },
  {
    id: 'REP-004',
    name: 'Employee Attendance Analysis',
    description: 'Detailed analysis of employee attendance trends.',
    status: 'Draft',
    date: '2024-08-15',
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Generated':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Draft':
      return 'outline';
    default:
      return 'destructive';
  }
};


export default function ReportingPage() {
  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
            <p className="text-muted-foreground mt-2">Generate and view institutional reports.</p>
       </div>

        <Card>
            <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>
                    A list of all generated and pending reports.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report Name</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.name}</TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">{report.description}</TableCell>
                                <TableCell className="hidden md:table-cell">{new Date(report.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                <TableCell>
                                     <Badge variant={getStatusVariant(report.status)}>
                                        {report.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button
                                            aria-haspopup="true"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>Generate</DropdownMenuItem>
                                        <DropdownMenuItem>Download</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  );
}
