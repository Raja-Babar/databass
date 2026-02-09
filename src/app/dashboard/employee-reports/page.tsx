'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useReports, EmployeeReport } from '@/hooks/use-reports'; // Import the new hook
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const REPORT_TYPES = ["Scanning", "Scanning Q-C", "PDF Pages", "PDF Q-C", "PDF Uploading"];
const STAGES = ["Completed", "Scanning", "Scanning Q-C", "PDF Pages", "PDF Q-C", "PDF Uploading", "Leave"];

export default function EmployeeReportsPage() {
  const { user, users } = useAuth(); // Get user and all users for name mapping
  const { employeeReports, addEmployeeReport, updateEmployeeReport, deleteEmployeeReport } = useReports(); // Use the new hook

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<EmployeeReport | null>(null);
  const [formData, setFormData] = useState({ type: '', quantity: '' });

  const filteredReports = useMemo(() => {
    if (!user) return [];
    // Admins see all reports, employees only see their own
    const reports = user.role === 'Admin' ? employeeReports : employeeReports.filter(r => r.employee_id === user.id);
    return reports.filter(r => r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [employeeReports, user, searchQuery]);

  const handleOpenForm = (report: EmployeeReport | null) => {
    setEditingReport(report);
    if (report) {
      setFormData({ type: report.type, quantity: String(report.quantity) });
    } else {
      setFormData({ type: '', quantity: '' });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!user) return;
    if (!formData.type || !formData.quantity) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill in all fields.' });
      return;
    }

    const reportData = {
      employee_id: user.id,
      employee_name: user.name,
      submitted_date: new Date().toISOString(),
      stage: 'Completed', // Default stage on creation
      type: formData.type,
      quantity: parseInt(formData.quantity, 10),
    };

    if (editingReport) {
      await updateEmployeeReport(editingReport.id, { type: reportData.type, quantity: reportData.quantity });
    } else {
      await addEmployeeReport(reportData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (reportId: string) => {
    await deleteEmployeeReport(reportId);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Employee Work Reports</CardTitle>
                <CardDescription>View, create, and manage your daily work reports.</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm(null)}>Create New Report</Button>
        </CardHeader>
        <CardContent>
          <Input 
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mb-4 max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>{report.employee_name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.quantity}</TableCell>
                  <TableCell>{new Date(report.submitted_date).toLocaleDateString()}</TableCell>
                  <TableCell>{report.stage}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(report)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Report' : 'Create New Report'}</DialogTitle>
            <DialogDescription>Fill in the details of your work for today.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
              <SelectTrigger><SelectValue placeholder="Select Report Type" /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input 
              type="number" 
              placeholder="Quantity"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
