'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilePlus, Trash2, Loader2, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useReports } from '@/hooks/itsection/use-reports';
import { useToast } from '@/hooks/use-toast';

const reportStages = ["Scanning", "Scanning Q-C", "PDF Pages", "PDF Q-C", "PDF Uploading", "Completed"];
const reportTypes = ["Pages", "Books"];

export default function EmployeeReportsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { reports, addReport, deleteReport, loading } = useReports(user);
    
    const [newReportStage, setNewReportStage] = useState('');
    const [newReportType, setNewReportType] = useState('');
    const [newReportQuantity, setNewReportQuantity] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const handleAddReport = async () => {
        const qty = parseInt(newReportQuantity, 10);
        if (!newReportStage || !newReportType || isNaN(qty) || qty <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter all details correctly.' });
            return;
        }

        // Hook update: make sure your useReports addReport accepts 4th argument as date
        const success = await addReport(newReportStage, newReportType, qty, reportDate);
        if (success) {
            setNewReportStage('');
            setNewReportType('');
            setNewReportQuantity('');
            // Optional: reset date to today after submission
            setReportDate(new Date().toISOString().split('T')[0]);
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = filterDate ? r.submitted_date === filterDate : true;
        return matchesSearch && matchesDate;
    });

    // --- Split Calculations ---
    const totalPages = filteredReports
        .filter(r => r.type === 'Pages')
        .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

    const totalBooks = filteredReports
        .filter(r => r.type === 'Books')
        .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Digitization Reports</h1>
                    <p className="text-muted-foreground text-sm">Daily progress and work logs.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 px-2 rounded-md border">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Filter:</span>
                        <Input 
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-40 border-none bg-transparent h-8 focus-visible:ring-0"
                        />
                    </div>
                    {user?.role === 'Admin' && (
                        <Input 
                            placeholder="Search employee..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-48 h-10"
                        />
                    )}
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            {/* Submission Form */}
            {user?.role === 'I.T & Scanning-Employee' && (
                <Card className="border-primary/20 shadow-sm print:hidden">
                    <CardHeader className="pb-3"><CardTitle className="text-md">Submit Work (Backdated entry allowed)</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-primary">Work Date</label>
                            <Input 
                                type="date" 
                                value={reportDate} 
                                onChange={(e) => setReportDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase">Stage</label>
                            <Select value={newReportStage} onValueChange={setNewReportStage}>
                                <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                                <SelectContent>{reportStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase">Type</label>
                            <Select value={newReportType} onValueChange={setNewReportType}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>{reportTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase">Quantity</label>
                            <Input type="number" placeholder="00" value={newReportQuantity} onChange={(e) => setNewReportQuantity(e.target.value)} />
                        </div>
                        <Button onClick={handleAddReport} className="w-full bg-primary hover:bg-primary/90">
                            <FilePlus className="mr-2 h-4 w-4" /> Submit Report
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Reports Table */}
            <Card className="print:border-none print:shadow-none">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Work Date</TableHead>
                                        <TableHead>Stage</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-center print:hidden">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.employee_name}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{report.submitted_date}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase italic">Logged: {report.submitted_time}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{report.stage}</Badge></TableCell>
                                            <TableCell>
                                                <span className={report.type === 'Books' ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                                                    {report.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">{report.quantity.toLocaleString()}</TableCell>
                                            <TableCell className="text-center print:hidden">
                                                {(user?.role === 'Admin' || user?.id === report.employee_id) && (
                                                    <Button variant="ghost" size="icon" onClick={() => deleteReport(report.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Summary Footer with Split Totals */}
                            <div className="flex flex-col md:flex-row justify-end gap-4 md:gap-12 border-t pt-6 bg-muted/20 p-4 rounded-lg mt-4">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-black">Total Pages</p>
                                    <p className="text-2xl font-black text-blue-600">{totalPages.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-black">Total Books</p>
                                    <p className="text-2xl font-black text-green-600">{totalBooks.toLocaleString()}</p>
                                </div>
                                <div className="text-right border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-12">
                                    <p className="text-xs text-muted-foreground uppercase font-black">Grand Total (Combined)</p>
                                    <p className="text-3xl font-black text-primary">{(totalPages + totalBooks).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}