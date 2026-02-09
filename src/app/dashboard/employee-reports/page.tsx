

'use client';

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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, FilePlus, Edit, Trash2, Calendar as CalendarIcon, Search, ChevronDown, ChevronUp } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EmployeeReport } from '@/context/auth-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const reportStages = ["Scanning", "Scanning Q-C", "PDF Pages", "PDF Q-C", "PDF Uploading", "Completed"];
const reportTypes = ["Pages", "Books"];

type CombinedRecord = (EmployeeReport & { isLeaveRecord?: false }) | (Partial<EmployeeReport> & { isLeaveRecord: true, submittedDate: string, employeeId: string, employeeName: string });


const getStageBadgeClass = (stage?: string) => {
    if (!stage) return '';
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

const getAttendanceStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'Present':
        return 'default';
      case 'Absent':
        return 'destructive';
      case 'Leave':
        return 'secondary';
      default:
        return 'outline';
    }
  };


export default function EmployeeReportsPage() {
    const { user, employeeReports: reports, addEmployeeReport, updateEmployeeReport, deleteEmployeeReport, attendanceRecords, getUsers } = useAuth();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [newReportStage, setNewReportStage] = useState('');
    const [newReportType, setNewReportType] = useState('');
    const [newReportQuantity, setNewReportQuantity] = useState('');

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<EmployeeReport | null>(null);
    const [editedStage, setEditedStage] = useState('');
    const [editedType, setEditedType] = useState('');
    const [editedQuantity, setEditedQuantity] = useState('');
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
    const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
    const REPORTS_TO_SHOW = 1;

    const employeeReports = useMemo(() => {
        if (user?.role === 'I.T & Scanning-Employee') {
            return reports.filter(report => report.employeeId === user.id);
        }
        return reports;
    }, [user, reports]);

    const monthlyReports = useMemo(() => {
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        return employeeReports.filter(r => {
            const reportDate = new Date(r.submittedDate + 'T00:00:00');
            return reportDate.getMonth() === month && reportDate.getFullYear() === year;
        });
    }, [selectedDate, employeeReports]);

     const reportsByEmployee = useMemo(() => {
        const grouped: { [key: string]: { employeeId: string, employeeName: string, employeeAvatar?: string, reports: CombinedRecord[], summary: { byStage: { [key: string]: number } } } } = {};
        const allUsers = getUsers().filter(u => u.role === 'I.T & Scanning-Employee');

        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const allDaysInMonth = eachDayOfInterval({ start, end });

        const usersToDisplay = user?.role === 'I.T & Scanning-Employee' ? allUsers.filter(u => u.id === user.id) : allUsers;

        usersToDisplay.forEach(emp => {
            const employeeData = {
                employeeId: emp.id,
                employeeName: emp.name,
                employeeAvatar: emp.avatar,
                reports: [] as CombinedRecord[],
                summary: { byStage: {} },
            };

            const userReportsForMonth = monthlyReports.filter(r => r.employeeId === emp.id);

            const userAttendanceForMonth = attendanceRecords.filter(ar => {
                const recordDate = new Date(ar.date + 'T00:00:00');
                return ar.employeeId === emp.id &&
                       recordDate.getFullYear() === selectedDate.getFullYear() &&
                       recordDate.getMonth() === selectedDate.getMonth();
            });

            const combinedRecords: CombinedRecord[] = [...userReportsForMonth];

            userAttendanceForMonth.forEach(ar => {
                if (ar.status === 'Leave' && !combinedRecords.some(cr => cr.submittedDate === ar.date)) {
                    combinedRecords.push({
                        id: `LEAVE-${ar.employeeId}-${ar.date}`,
                        employeeId: ar.employeeId,
                        employeeName: ar.name,
                        submittedDate: ar.date,
                        isLeaveRecord: true,
                        // @ts-expect-error
                        submittedTime: '--:--',
                    });
                }
            });

            combinedRecords.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

            employeeData.reports = combinedRecords;

            const byStage: { [key: string]: number } = {};
            userReportsForMonth.forEach(report => {
                let stageKey = report.stage;
                if (report.stage === 'PDF Pages') {
                    stageKey = `PDF Pages (${report.type})`;
                }

                if (!byStage[stageKey]) {
                    byStage[stageKey] = 0;
                }
                byStage[stageKey] += report.quantity;
            });
            employeeData.summary.byStage = byStage;

            grouped[emp.id] = employeeData;
        });


        return Object.values(grouped).filter(employeeData =>
            employeeData.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [monthlyReports, selectedDate, attendanceRecords, user, getUsers, searchTerm]);


    const selectedMonthFormatted = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
    });
    
    const getBase64Image = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error fetching or converting image:', error);
            return '';
        }
    };


    const handleExportAllPDF = async () => {
      const doc = new jsPDF();
      let finalY = 20;
  
      doc.text(`Digitization Report - ${selectedMonthFormatted}`, 14, 16);
      finalY = 22;
      doc.setFontSize(10);
      doc.text(`A summary of all digitization reports for ${selectedMonthFormatted}.`, 14, finalY);
      finalY += 8;

      for (const { employeeName, employeeAvatar, reports, summary } of reportsByEmployee) {
        doc.addPage();
        finalY = 20;
        doc.setPage(doc.internal.getNumberOfPages());

        if (employeeAvatar) {
            const imageData = await getBase64Image(employeeAvatar);
            if (imageData) {
                doc.saveGraphicsState();
                doc.circle(14 + 10, finalY + 10, 10);
                doc.clip();
                doc.addImage(imageData, 'PNG', 14, finalY, 20, 20);
                doc.restoreGraphicsState();
                finalY += 25;
            }
        }
        
        doc.setFontSize(14);
        doc.text(`Digitization Report - ${selectedMonthFormatted}`, 14, finalY);
        finalY += 6;

        doc.setFontSize(12);
        doc.text(employeeName, 14, finalY);
        finalY += 10;


        // Submitted Reports Table
        autoTable(doc, {
            head: [['Date Submitted', 'Time Submitted', 'Stage', 'Type', 'Quantity']],
            body: reports.filter(r => !r.isLeaveRecord).map(r => [
                new Date(r.submittedDate + 'T00:00:00').toLocaleDateString(),
                (r as EmployeeReport).submittedTime || '--:--',
                r.stage,
                r.type,
                r.quantity?.toString(),
            ]),
            startY: finalY,
            didDrawPage: function (data: any) {
                finalY = data.cursor.y;
            }
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
  
        if (reports.length > 0) {
            doc.setFontSize(12);
            doc.text('Monthly Summary', 14, finalY);
            finalY += 5;
    
            // Summary by Stage Table
            doc.text('Summary by Stage', 14, finalY);
            autoTable(doc, {
                head: [['Stage', 'Quantity']],
                body: Object.entries(summary.byStage).map(([stage, quantity]) => [stage, quantity.toLocaleString()]),
                startY: finalY + 2,
                margin: { left: 14 },
                tableWidth: 'auto',
                didDrawPage: (data: any) => {
                    finalY = data.cursor.y;
                }
            });
            finalY = (doc as any).lastAutoTable.finalY;
        }
      }
      
      doc.deletePage(1); // Delete the initial blank page
  
      doc.save(`digitization_reports_all_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.pdf`);
    };
    
    const handleExportSinglePDF = async (employeeData: { employeeName: string; employeeAvatar?: string; reports: CombinedRecord[]; summary: { byStage: { [key: string]: number } } }) => {
        const { employeeName, employeeAvatar, reports, summary } = employeeData;
        const doc = new jsPDF();
        let finalY = 20;

        if (employeeAvatar) {
            const imageData = await getBase64Image(employeeAvatar);
            if (imageData) {
                doc.saveGraphicsState();
                doc.circle(14 + 10, finalY + 10, 10);
                doc.clip();
                doc.addImage(imageData, 'PNG', 14, finalY, 20, 20);
                doc.restoreGraphicsState();
                finalY += 25; // Move down to leave space after the image
            }
        }
    
        doc.setFontSize(14);
        doc.text(`Digitization Report - ${selectedMonthFormatted}`, 14, finalY);
        finalY += 6;
        
        doc.setFontSize(12);
        doc.text(employeeName, 14, finalY);
        finalY += 10;

        // Submitted Reports Table
        autoTable(doc, {
            head: [['Date Submitted', 'Time Submitted', 'Stage', 'Type', 'Quantity']],
            body: reports.filter(r => !r.isLeaveRecord).map(r => [
                new Date(r.submittedDate + 'T00:00:00').toLocaleDateString(),
                (r as EmployeeReport).submittedTime || '--:--',
                r.stage,
                r.type,
                r.quantity?.toString(),
            ]),
            startY: finalY,
            didDrawPage: function (data: any) {
                finalY = data.cursor.y;
            }
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
  
        if (Object.keys(summary.byStage).length > 0) {
            doc.setFontSize(12);
            doc.text('Monthly Summary by Stage', 14, finalY);
            finalY += 5;
    
            // Summary by Stage Table
            autoTable(doc, {
                head: [['Stage', 'Quantity']],
                body: Object.entries(summary.byStage).map(([stage, quantity]) => [stage, quantity.toLocaleString()]),
                startY: finalY + 2,
                margin: { left: 14 },
                tableWidth: 'auto',
                didDrawPage: (data: any) => {
                    finalY = data.cursor.y;
                }
            });
            finalY = (doc as any).lastAutoTable.finalY;
        }
      
        doc.save(`digitization_report_${employeeName.replace(' ', '_')}_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.pdf`);
    };

  const handleAddReport = () => {
    if (!newReportStage || !newReportType || !newReportQuantity) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Please select a stage, type, and enter a quantity.',
      });
      return;
    }
    
    const quantity = parseInt(newReportQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Please enter a valid quantity.',
      });
      return;
    }


    if (user) {
      const now = new Date();
      addEmployeeReport({
        id: `REP-${Date.now()}`,
        employeeId: user.id,
        employeeName: user.name,
        submittedDate: now.toISOString().split('T')[0],
        submittedTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        stage: newReportStage,
        type: newReportType,
        quantity: quantity,
      });

      toast({
        title: 'Report Submitted',
        description: 'Your new report has been added.',
      });
      setNewReportStage('');
      setNewReportType('');
      setNewReportQuantity('');
    }
  };
  
    const handleEditClick = (report: EmployeeReport) => {
        setSelectedReport(report);
        setEditedStage(report.stage);
        setEditedType(report.type);
        setEditedQuantity(report.quantity.toString());
        setIsEditDialogOpen(true);
    };

    const handleUpdateReport = () => {
        if (selectedReport) {
            const quantity = parseInt(editedQuantity, 10);
            if (isNaN(quantity) || quantity <= 0) {
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Please enter a valid quantity.',
                });
                return;
            }
            updateEmployeeReport(selectedReport.id, {
                stage: editedStage,
                type: editedType,
                quantity: quantity,
            });
            toast({
                title: 'Report Updated',
                description: 'The report has been successfully updated.',
            });
            setIsEditDialogOpen(false);
            setSelectedReport(null);
        }
    };

    const handleDeleteReport = (reportId: string) => {
        deleteEmployeeReport(reportId);
        toast({
            title: 'Report Deleted',
            description: 'The report has been successfully deleted.',
        });
    };

     const handleDeleteSelected = () => {
        selectedReportIds.forEach(id => deleteEmployeeReport(id));
        toast({
            title: `${selectedReportIds.length} Report(s) Deleted`,
            description: 'The selected reports have been successfully deleted.',
        });
        setSelectedReportIds([]);
    };

    const handleSelectAll = (checked: boolean, reports: CombinedRecord[]) => {
        if (checked) {
            const allReportIds = reports.filter(r => !r.isLeaveRecord).map(r => r.id!);
            setSelectedReportIds(allReportIds);
        } else {
            setSelectedReportIds([]);
        }
    };

    const handleSelectRow = (checked: boolean, reportId: string) => {
        if (checked) {
            setSelectedReportIds(prev => [...prev, reportId]);
        } else {
            setSelectedReportIds(prev => prev.filter(id => id !== reportId));
        }
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
            <h1 className="text-3xl font-bold tracking-tight">Digitization Report</h1>
            <p className="text-muted-foreground mt-2">
              Viewing reports for <span className="font-semibold text-primary">{selectedMonthFormatted}</span>
            </p>
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

      {user?.role === 'I.T & Scanning-Employee' && (
        <Card>
            <CardHeader>
                <CardTitle>Submit a New Report</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Report Stage</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="hidden md:table-cell">Date Submitted</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">{user?.name}</TableCell>
                            <TableCell>
                                <Select value={newReportStage} onValueChange={setNewReportStage}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reportStages.map(stage => (
                                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select value={newReportType} onValueChange={setNewReportType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reportTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    placeholder="e.g., 100"
                                    value={newReportQuantity}
                                    onChange={(e) => setNewReportQuantity(e.target.value)}
                                />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {new Date().toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" onClick={handleAddReport}>
                                <FilePlus className="mr-2 h-4 w-4" /> Submit
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      {reportsByEmployee.length > 0 ? (
        reportsByEmployee.map((employeeData) => {
            const { employeeId, employeeName, employeeAvatar, reports: employeeCombinedRecords, summary } = employeeData;
            const selectableReports = employeeCombinedRecords.filter(r => !r.isLeaveRecord);
            const isAllSelected = selectableReports.length > 0 && selectedReportIds.length === selectableReports.length;
            const isExpanded = expandedEmployees.includes(employeeId);
            const visibleRecords = isExpanded ? employeeCombinedRecords : employeeCombinedRecords.slice(0, REPORTS_TO_SHOW);
            const hasMoreRecords = employeeCombinedRecords.length > REPORTS_TO_SHOW;
            
            const getInitials = (name: string) => {
                return name
                  .split(' ')
                  .map((n) => n[0])
                  .join('');
            };

            return (
                <Card key={employeeId}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 hidden sm:flex">
                                <AvatarImage src={employeeAvatar || `https://avatar.vercel.sh/${employeeName}.png`} alt={employeeName} />
                                <AvatarFallback>{getInitials(employeeName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{employeeName}'s Reports &amp; Summary</CardTitle>
                                <CardDescription>
                                    Submitted reports and monthly summary for <span className="font-semibold text-primary">{selectedMonthFormatted}</span>.
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExportSinglePDF(employeeData)}>
                            <Download className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold">Submitted Reports</h3>
                                {user?.role === 'Admin' && selectedReportIds.length > 0 && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Selected ({selectedReportIds.length})
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Selected Reports</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete {selectedReportIds.length} selected report(s)? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    {user?.role === 'Admin' && (
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked), selectableReports)}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Time Submitted</TableHead>
                                    <TableHead>Report Stage</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Attendance Status</TableHead>
                                    {user?.role === 'Admin' && (
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                    )}
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {visibleRecords.map((report) => {
                                    const attendanceRecord = attendanceRecords.find(
                                        (r) =>
                                          r.employeeId === report.employeeId &&
                                          r.date === report.submittedDate
                                    );
                                    const attendanceStatus = report.isLeaveRecord ? 'Leave' : attendanceRecord?.status || 'Not Marked';

                                    return (
                                    <TableRow key={report.id}>
                                        {user?.role === 'Admin' && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedReportIds.includes(report.id!)}
                                                    onCheckedChange={(checked) => handleSelectRow(Boolean(checked), report.id!)}
                                                    aria-label={`Select report ${report.id}`}
                                                    disabled={report.isLeaveRecord}
                                                />
                                            </TableCell>
                                        )}
                                      <TableCell>
                                          {new Date(report.submittedDate + 'T00:00:00').toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>{report.isLeaveRecord ? '-' : (report as EmployeeReport).submittedTime || '--:--'}</TableCell>
                                      <TableCell>
                                        <Badge className={cn(getStageBadgeClass(report.stage))}>
                                            {report.isLeaveRecord ? '-' : report.stage}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{report.isLeaveRecord ? '-' : report.type}</TableCell>
                                      <TableCell className="font-semibold text-foreground">{report.isLeaveRecord ? '-' : report.quantity}</TableCell>
                                      <TableCell>
                                          <Badge variant={getAttendanceStatusBadgeClass(attendanceStatus)}>
                                              {attendanceStatus}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          {user?.role === 'Admin' && !report.isLeaveRecord && (
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
                                              <DropdownMenuItem onClick={() => handleEditClick(report as EmployeeReport)}>
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
                                                          <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                              Are you sure you want to delete this report? This action cannot be undone.
                                                          </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                          <AlertDialogAction onClick={() => handleDeleteReport(report.id!)}>Delete</AlertDialogAction>
                                                      </AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                              </DropdownMenuContent>
                                          </DropdownMenu>
                                          )}
                                      </TableCell>
                                    </TableRow>
                                    );
                                })}
                                </TableBody>
                            </Table>
                            {hasMoreRecords && (
                                <div className="pt-4 text-center">
                                    <Button variant="ghost" onClick={() => toggleEmployeeExpansion(employeeId)}>
                                        {isExpanded ? 'See Less' : 'See More'}
                                        {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {Object.keys(summary.byStage).length > 0 && (
                            <div>
                                <h3 className="text-base font-semibold mb-2">Monthly Summary by Stage</h3>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Stage</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(summary.byStage).map(([stage, quantity]) => (
                                    <TableRow key={stage}>
                                        <TableCell>{stage}</TableCell>
                                        <TableCell className="text-right">{quantity.toLocaleString()}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )
        })
      ) : (
        <Card>
            <CardContent className="text-center text-muted-foreground pt-8">
                No digitization reports found for this month.
            </CardContent>
        </Card>
      )}
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Make changes to the report here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage" className="text-right">Stage</Label>
              <Select onValueChange={setEditedStage} defaultValue={editedStage}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {reportStages.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select onValueChange={setEditedType} defaultValue={editedType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input
                    id="quantity"
                    type="number"
                    value={editedQuantity}
                    onChange={(e) => setEditedQuantity(e.target.value)}
                    className="col-span-3"
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleUpdateReport}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    

    
