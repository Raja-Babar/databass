'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, CheckCircle, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ScanningRecord = {
  id: string;
  book_id: string;
  title_english: string;
  status: string;
  assigned_to: string | null; // Employee Name
  assigned_date: string | null;
  assigned_time: string | null;
};

export default function EmployeeTaskRecordPage() {
  const [scanningRecords, setScanningRecords] = useState<ScanningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
  const RECORDS_TO_SHOW = 5;

  // --- 1. Fetch Records based on Role ---
  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('scanning_progress')
      .select('*')
      .not('assigned_to', 'is', null);

    // AGAR USER ADMIN NAHI HAI, TO DATABASE SE SIRF USKA DATA MANGWAO
    if (user.role !== 'Admin') {
      query = query.eq('assigned_to', user.name); 
    }

    const { data, error } = await query.order('assigned_date', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setScanningRecords(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // --- 2. Grouping Logic ---
  const tasksByEmployee = useMemo(() => {
    // Agar searching ho rahi hai (Admin ke liye)
    const filtered = scanningRecords.filter(r => 
        r.title_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by employee name
    const groups = filtered.reduce((acc: any, task) => {
      const name = task.assigned_to || 'Unassigned';
      if (!acc[name]) acc[name] = [];
      acc[name].push(task);
      return acc;
    }, {});

    return Object.keys(groups).map(name => ({
      employeeName: name,
      tasks: groups[name]
    }));
  }, [scanningRecords, searchTerm]);

  // --- 3. Update Task Status ---
  const handleMarkComplete = async (recordId: string) => {
    const { error } = await supabase
      .from('scanning_progress')
      .update({ status: 'Completed' })
      .eq('id', recordId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setScanningRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'Completed' } : r));
      toast({ title: 'Task Completed', description: 'Status updated successfully.' });
    }
  };

  const getStatusClasses = (status: string) => {
    if (status?.toLowerCase() === 'completed') return 'bg-green-500 hover:bg-green-600 text-white';
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assigned Tasks</h1>
          <p className="text-muted-foreground">
            {user?.role === 'Admin' ? 'Tracking all employee tasks.' : 'Manage your assigned book tasks.'}
          </p>
        </div>
        
        {user?.role === 'Admin' && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by book or employee..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {tasksByEmployee.length > 0 ? (
          tasksByEmployee.map((emp) => {
            const isExpanded = expandedEmployees.includes(emp.employeeName);
            const displayTasks = isExpanded ? emp.tasks : emp.tasks.slice(0, RECORDS_TO_SHOW);

            return (
              <Card key={emp.employeeName} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {emp.employeeName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{emp.employeeName}</CardTitle>
                    <CardDescription>{emp.tasks.length} active assignments</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Information</TableHead>
                        <TableHead>Assigned On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{task.title_english}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {task.assigned_date} <br />
                            <span className="text-muted-foreground">{task.assigned_time}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusClasses(task.status)}>{task.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {task.status !== 'Completed' && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-green-600 text-green-600 hover:bg-green-50"
                                    onClick={() => handleMarkComplete(task.id)}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" /> Done
                                </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {emp.tasks.length > RECORDS_TO_SHOW && (
                    <div className="mt-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setExpandedEmployees(prev => 
                          isExpanded ? prev.filter(n => n !== emp.employeeName) : [...prev, emp.employeeName]
                        );
                      }}>
                        {isExpanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                        {isExpanded ? 'See Less' : `View All ${emp.tasks.length} Tasks`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
            <p className="text-muted-foreground">No tasks assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}