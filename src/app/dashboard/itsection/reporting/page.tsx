'use client';

import { useState } from 'react';
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
import { MoreHorizontal, Download, FileText, Loader2, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Hooks
import { useAuth } from '@/hooks/use-auth';
import { useReports } from '@/hooks/use-reports';

export default function ReportingPage() {
  const { user } = useAuth();
  const { reports, loading, deleteReport } = useReports(user);
  
  // PDF Export Logic (Simple Browser Print for now)
  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
        <div className="flex justify-between items-center print:hidden">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Reporting</h1>
                <p className="text-muted-foreground mt-2">View and manage all digitization and activity reports.</p>
            </div>
            <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Digitization Live Reports</CardTitle>
                <CardDescription>
                    Real-time data fetched from the employee submission system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="hidden md:table-cell">Stage</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="print:hidden">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                {report.employee_name}
                                                <span className="text-xs text-muted-foreground md:hidden">{report.stage}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {report.stage}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell italic text-xs">
                                            {report.submitted_date}
                                        </TableCell>
                                        <TableCell>
                                             <Badge variant="default" className="bg-green-600">
                                                Submitted
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {report.quantity}
                                        </TableCell>
                                        <TableCell className="text-right print:hidden">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-blue-600">
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    {user?.role === 'Admin' && (
                                                        <DropdownMenuItem 
                                                            onClick={() => deleteReport(report.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No reports found in the database.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}