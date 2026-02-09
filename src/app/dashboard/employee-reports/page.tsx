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
import { Button } from '@/components/ui/button';
import { Download, FilePlus, Edit, Trash2, Calendar as CalendarIcon, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const reportStages = ["Scanning", "Scanning Q-C", "PDF Pages", "PDF Q-C", "PDF Uploading", "Completed"];
const reportTypes = ["Pages", "Books"];

// UI Helper: Stage Badge Colors
const getStageBadgeClass = (stage?: string) => {
    if (!stage) return 'bg-gray-500 text-white';
    switch (stage.toLowerCase()) {
        case 'completed': return 'bg-green-600 text-white hover:bg-green-700';
        case 'scanning': return 'bg-blue-500 text-white hover:bg-blue-600';
        case 'scanning q-c': return 'bg-yellow-500 text-black hover:bg-yellow-600';
        case 'pdf pages': return 'bg-purple-500 text-white hover:bg-purple-600';
        case 'pdf q-c': return 'bg-orange-500 text-white hover:bg-orange-600';
        case 'pdf uploading': return 'bg-teal-500 text-white hover:bg-teal-600';
        default: return 'bg-gray-500 text-white';
    }
};

export default function EmployeeReportsPage() {
    const { user, employeeReports, addEmployeeReport, deleteEmployeeReport, attendanceRecords, isLoading } = useAuth();
    const { toast } = useToast();
    
    // States
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [newReportStage, setNewReportStage] = useState('');
    const [newReportType, setNewReportType] = useState('');
    const [newReportQuantity, setNewReportQuantity] = useState('');
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
    const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const REPORTS_TO_SHOW = 3;

    // Filter reports based on User Role and Selected Month
    const filteredReports = useMemo(() => {
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();

        return employeeReports.filter(r => {
            const rDate = new Date(r.submittedDate);
            const matchesDate = rDate.getMonth() === month && rDate.getFullYear() === year;
            const matchesUser = user?.role === 'Admin' ? true : r.employeeId === user?.id;
            return matchesDate && matchesUser;
        });
    }, [selectedDate, employeeReports, user]);

    // Grouping logic for Admin View
    const reportsByEmployee = useMemo(() => {
        const grouped: any = {};
        filteredReports.forEach(report => {
            if (!grouped[report.employeeId]) {
                grouped[report.employeeId] = {
                    employeeId: report.employeeId,
                    employeeName: report.employeeName,
                    reports: [],
                    summary: {}
                };
            }
            grouped[report.employeeId].reports.push(report);
        });
        return Object.values(grouped).filter((emp: any) => 
            emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [filteredReports, searchTerm]);

    // Action: Add Report
    const handleAddReport = async () => {
        if (!newReportStage || !newReportType || !newReportQuantity) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill all fields.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addEmployeeReport({
                stage: newReportStage,
                type: newReportType,
                quantity: parseInt(newReportQuantity),
                submittedDate: format(new Date(), 'yyyy-MM-dd'),
                submittedTime: format(new Date(), 'hh:mm a')
            });
            
            setNewReportStage('');
            setNewReportType('');
            setNewReportQuantity('');
            toast({ title: 'Success', description: 'Report submitted successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit report.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Action: Delete Report
    const handleDelete = async (id: string) => {
        await deleteEmployeeReport(id);
        toast({ title: 'Deleted', description: 'Report removed.' });
    };

    // PDF Export Logic (Simplified for brevity)
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Digitization Report - ${format(selectedDate, 'MMMM yyyy')}`, 14, 15);
        
        const tableData = filteredReports.map(r => [
            r.submittedDate,
            r.employeeName,
            r.stage,
            r.type,
            r.quantity
        ]);

        autoTable(doc, {
            head: [['Date', 'Employee', 'Stage', 'Type', 'Qty']],
            body: tableData,
            startY: 20
        });

        doc.save(`Report_${format(selectedDate, 'MMM_yyyy')}.pdf`);
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Digitization Reports</h1>
                    <p className="text-muted-foreground">Manage and track scanning progress.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start text-left">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(selectedDate, "MMMM yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleExportPDF} variant="secondary">
                        <Download className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Submit Section (Only for Employees) */}
            {user?.role !== 'Admin' && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader><CardTitle className="text-lg">Submit Today's Progress</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={newReportStage} onValueChange={setNewReportStage}>
                            <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                            <SelectContent>{reportStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newReportType} onValueChange={setNewReportType}>
                            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                            <SelectContent>{reportTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input 
                            type="number" 
                            placeholder="Quantity" 
                            value={newReportQuantity} 
                            onChange={(e) => setNewReportQuantity(e.target.value)} 
                        />
                        <Button onClick={handleAddReport} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <FilePlus className="mr-2 h-4 w-4" />}
                            Submit Report
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Reports List */}
            <div className="grid gap-6">
                {user?.role === 'Admin' && (
                   <div className="relative max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search employee name..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                   </div>
                )}

                {reportsByEmployee.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl bg-slate-50/50">
                        <p className="text-muted-foreground">No reports found for this period.</p>
                    </div>
                ) : (
                    reportsByEmployee.map((emp: any) => (
                        <Card key={emp.employeeId} className="overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">{emp.employeeName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{emp.employeeName}</CardTitle>
                                        <CardDescription>{emp.reports.length} Reports submitted</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setExpandedEmployees(prev => prev.includes(emp.employeeId) ? prev.filter(id => id !== emp.employeeId) : [...prev, emp.employeeId])
                                }}>
                                    {expandedEmployees.includes(emp.employeeId) ? <ChevronUp /> : <ChevronDown />}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">Date</TableHead>
                                            <TableHead>Stage</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {emp.reports.slice(0, expandedEmployees.includes(emp.employeeId) ? undefined : REPORTS_TO_SHOW).map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="pl-6 font-medium">{r.submittedDate}</TableCell>
                                                <TableCell><Badge className={getStageBadgeClass(r.stage)}>{r.stage}</Badge></TableCell>
                                                <TableCell>{r.type}</TableCell>
                                                <TableCell className="font-bold">{r.quantity.toLocaleString()}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}