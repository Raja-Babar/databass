// src/app/dashboard/employee-task-record/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { scanningProgressRecords as scanningProgressRecordsJSON } from '@/lib/placeholder-data';
import { Download, Search, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type ScanningRecord = {
  book_id: string;
  title_english: string;
  status: string;
  assigned_to: string | null;
  assigned_date: string | null;
  assigned_time: string | null;
};

const getStatusClasses = (status: string) => {
  switch (status?.toLowerCase()) {
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

export default function EmployeeTaskRecordPage() {
  const [scanningRecords, setScanningRecords] = useState<ScanningRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, getUsers } = useAuth();
  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
  const RECORDS_TO_SHOW = 5;

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem('scanningProgressRecords');
      setScanningRecords(storedRecords ? JSON.parse(storedRecords) : JSON.parse(scanningProgressRecordsJSON));
    } catch (e) {
      setScanningRecords(JSON.parse(scanningProgressRecordsJSON));
    }
  }, []);
  
  const tasksByEmployee = useMemo(() => {
    const assignedTasks = scanningRecords.filter(record => record.assigned_to);
    const employees = getUsers().filter(u => u.role === 'I.T & Scanning-Employee');
    const usersToDisplay = user?.role === 'Admin' ? employees : employees.filter(e => e.name === user?.name);

    const grouped = usersToDisplay.map(employee => {
        const tasks = assignedTasks.filter(task => task.assigned_to === employee.name)
            .sort((a, b) => {
                const dateA = a.assigned_date ? new Date(a.assigned_date).getTime() : 0;
                const dateB = b.assigned_date ? new Date(b.assigned_date).getTime() : 0;
                return dateB - dateA;
            });
        
        return {
            employeeId: employee.id,
            employeeName: employee.name,
            employeeAvatar: employee.avatar,
            tasks,
        };
    }).filter(empData => empData.tasks.length > 0);

    if (user?.role === 'Admin') {
        return grouped.filter(emp => emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return grouped;

  }, [scanningRecords, user, getUsers, searchTerm]);


  const handleExportAllPDF = () => {
    if (tasksByEmployee.length === 0) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "There are no tasks to export."
        });
        return;
    }

    const doc = new jsPDF();
    doc.text('Employee Assigned Tasks Report', 14, 16);
    let finalY = 22;

    tasksByEmployee.forEach(({ employeeName, tasks }) => {
        if (tasks.length > 0) {
            doc.setFontSize(12);
            doc.text(`Tasks for ${employeeName}`, 14, finalY);
            finalY += 6;

            (doc as any).autoTable({
                head: [['Book Title', 'Assigned At', 'Status']],
                body: tasks.map(task => [
                    task.title_english,
                    task.assigned_date ? `${task.assigned_date} ${task.assigned_time}` : 'N/A',
                    task.status
                ]),
                startY: finalY,
                didDrawPage: function(data: any) {
                    if(data.pageNumber > 1) { finalY = 20; }
                }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }
    });
    
    doc.save('employee_tasks_report_all.pdf');
    toast({
        title: "Export Successful",
        description: "The task list has been exported to PDF."
    });
  }

  const handleExportSinglePDF = (employeeData: { employeeName: string; tasks: ScanningRecord[] }) => {
     if (employeeData.tasks.length === 0) {
        toast({ variant: "destructive", title: "Export Failed", description: "This employee has no tasks to export." });
        return;
    }
    const doc = new jsPDF();
    doc.text(`Assigned Tasks for ${employeeData.employeeName}`, 14, 16);
    (doc as any).autoTable({
        head: [['Book Title', 'Assigned At', 'Status']],
        body: employeeData.tasks.map(task => [
            task.title_english,
            task.assigned_date ? `${task.assigned_date} ${task.assigned_time}` : 'N/A',
            task.status
        ]),
        startY: 22,
    });
    doc.save(`employee_tasks_${employeeData.employeeName.replace(' ', '_')}.pdf`);
  };

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev =>
        prev.includes(employeeId)
            ? prev.filter(id => id !== employeeId)
            : [...prev, employeeId]
    );
  };
  
    const getInitials = (name: string) => {
        return name
        .split(' ')
        .map((n) => n[0])
        .join('');
    };

    const handleMarkComplete = (bookId: string) => {
        setScanningRecords(prevRecords => {
            const updatedRecords = prevRecords.map(record =>
                record.book_id === bookId ? { ...record, status: 'Completed' } : record
            );
            localStorage.setItem('scanningProgressRecords', JSON.stringify(updatedRecords));
            return updatedRecords;
        });
        toast({
            title: 'Task Completed',
            description: 'The task has been marked as complete.',
        });
    };

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Employee Task Records</h1>
            <p className="text-muted-foreground mt-2">A log of all tasks assigned to employees.</p>
        </div>
         <div className="flex items-center gap-2 w-full md:w-auto flex-col sm:flex-row">
          {user?.role === 'Admin' && (
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
          <Button variant="outline" onClick={handleExportAllPDF} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export All PDF
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {tasksByEmployee.length > 0 ? (
            tasksByEmployee.map(employeeData => {
              const isExpanded = expandedEmployees.includes(employeeData.employeeId);
              const visibleRecords = isExpanded ? employeeData.tasks : employeeData.tasks.slice(0, RECORDS_TO_SHOW);
              const hasMoreRecords = employeeData.tasks.length > RECORDS_TO_SHOW;

              return (
                 <Card key={employeeData.employeeId}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 hidden sm:flex">
                                <AvatarImage src={employeeData.employeeAvatar || `https://avatar.vercel.sh/${employeeData.employeeName}.png`} alt={employeeData.employeeName} />
                                <AvatarFallback>{getInitials(employeeData.employeeName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{employeeData.employeeName}'s Tasks</CardTitle>
                                <CardDescription>A list of all tasks assigned to {employeeData.employeeName}.</CardDescription>
                            </div>
                        </div>
                        {user?.role === 'Admin' && (
                            <Button variant="outline" size="sm" onClick={() => handleExportSinglePDF(employeeData)}>
                                <Download className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead>Assigned At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleRecords.map((task) => (
                              <TableRow key={task.book_id}>
                                <TableCell className="font-medium">{task.title_english}</TableCell>
                                <TableCell>
                                  {task.assigned_date ? `${task.assigned_date} ${task.assigned_time}` : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusClasses(task.status)}>{task.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {user?.id === employeeData.employeeId && task.status !== 'Completed' && (
                                        <Button variant="outline" size="sm" onClick={() => handleMarkComplete(task.book_id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark as Complete
                                        </Button>
                                    )}
                                </TableCell>
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
                        <h3 className="font-semibold text-lg mt-2">Total Tasks Assigned</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{employeeData.tasks.length}</span> tasks
                        </p>
                    </CardFooter>
                </Card>
              )
            })
        ) : (
             <Card>
                <CardContent className="text-center text-muted-foreground pt-8">
                     No assigned tasks found.
                </CardContent>
            </Card>
        )}
      </div>

    </div>
  );
}
