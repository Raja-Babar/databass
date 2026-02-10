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
import { cn } from '@/lib/utils';

// Database Schema ke mutabiq type definition
type DigitizationRecord = {
  id: string;
  file_name: string;
  book_name: string;
  stage: string;
  assignee: string | null;
  deadline: string | null;
};

export default function EmployeeTaskRecordPage() {
  const [records, setRecords] = useState<DigitizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);
  const RECORDS_TO_SHOW = 5;

  // --- 1. Fetch Records from digitization_records ---
  const fetchRecords = useCallback(async () => {
    if (!user) return;
    
    let query = supabase
      .from('digitization_records')
      .select('*')
      .not('assignee', 'is', null);

    if (user.role !== 'Admin') {
      query = query.eq('assignee', user.name); 
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  // --- 2. Realtime Sync (Table sync baghair refresh ke) ---
  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel('digitization-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'digitization_records' },
        () => { fetchRecords(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  // --- 3. Search & Grouping Logic ---
  const tasksByEmployee = useMemo(() => {
    const filtered = records.filter(r => 
        r.book_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = filtered.reduce((acc: any, task) => {
      const name = task.assignee || 'Unassigned';
      if (!acc[name]) acc[name] = [];
      acc[name].push(task);
      return acc;
    }, {});

    return Object.keys(groups).map(name => ({
      employeeName: name,
      tasks: groups[name]
    }));
  }, [records, searchTerm]);

  // --- 4. Handle Mark Complete ---
  const handleMarkComplete = async (recordId: string) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, stage: 'Completed' } : r));

    const { error } = await supabase
      .from('digitization_records')
      .update({ stage: 'Completed' })
      .eq('id', recordId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      fetchRecords();
    } else {
      toast({ title: 'Success', description: 'Task marked as completed.' });
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Assignment Tracker</h1>
          <p className="text-slate-500 font-medium italic">Monitor and update digitization progress.</p>
        </div>
        
        {user?.role === 'Admin' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by book or employee..."
              className="pl-9 rounded-xl border-2 border-slate-200 focus:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Employee Cards & Tables */}
      <div className="grid gap-8">
        {tasksByEmployee.length > 0 ? (
          tasksByEmployee.map((emp) => {
            const isExpanded = expandedEmployees.includes(emp.employeeName);
            const displayTasks = isExpanded ? emp.tasks : emp.tasks.slice(0, RECORDS_TO_SHOW);

            return (
              <Card key={emp.employeeName} className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center gap-4 py-5">
                  <Avatar className="h-14 w-14 border-4 border-white shadow-md">
                    <AvatarFallback className="bg-indigo-600 text-white font-black text-xl uppercase">
                        {emp.employeeName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 uppercase leading-none">{emp.employeeName}</CardTitle>
                    <CardDescription className="font-bold text-indigo-500 text-xs uppercase tracking-widest mt-1">
                      {emp.tasks.length} Total Assignments
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none">
                          <TableHead className="font-black text-slate-900 uppercase text-[11px] pl-8 py-4 w-[45%]">Book / File Details</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[11px] text-center w-[15%]">Deadline</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[11px] w-[15%]">Stage</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[11px] text-right pr-8 w-[25%]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTasks.map((task) => (
                          <TableRow key={task.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-none">
                            <TableCell className="pl-8 py-5">
                              <div className="flex flex-col gap-2">
                                <span className="font-extrabold text-slate-800 text-[15px] leading-snug">
                                  {task.book_name}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-lg break-all inline-block w-fit">
                                  {task.file_name}
                                </span>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                {task.deadline || '---'}
                              </span>
                            </TableCell>

                            <TableCell>
                              <Badge className={cn(
                                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase shadow-none border",
                                task.stage === 'Completed' 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                  : task.stage === 'Scanning' 
                                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                              )}>
                                {task.stage}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-8">
                              {task.stage !== 'Completed' ? (
                                <Button 
                                  size="sm" 
                                  className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-slate-200 gap-2 h-9 px-4 transition-all active:scale-95"
                                  onClick={() => handleMarkComplete(task.id)}
                                >
                                  <CheckCircle className="h-4 w-4" /> Mark Done
                                </Button>
                              ) : (
                                <div className="flex justify-end">
                                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase">Completed</span>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {emp.tasks.length > RECORDS_TO_SHOW && (
                    <div className="p-4 bg-slate-50/30 text-center border-t border-slate-100">
                      <Button variant="ghost" size="sm" className="font-black text-indigo-600 hover:bg-indigo-50 rounded-xl px-6" onClick={() => {
                        setExpandedEmployees(prev => 
                          isExpanded ? prev.filter(n => n !== emp.employeeName) : [...prev, emp.employeeName]
                        );
                      }}>
                        {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                        {isExpanded ? 'SHOW LESS' : `VIEW ALL ${emp.tasks.length} RECORDS`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              <BookOpen className="h-12 w-12 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black italic uppercase text-sm tracking-widest">No active assignments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}