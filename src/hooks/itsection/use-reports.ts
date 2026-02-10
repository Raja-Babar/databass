'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/context/auth-provider';

export type Report = {
  id: string;
  employee_id: string;
  employee_name: string;
  submitted_date: string;
  submitted_time: string;
  stage: string;
  type: string;
  quantity: number;
};

export function useReports(user: User | null) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getPKDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  const getPKTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' }).format(new Date());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_reports')
      .select('*')
      .order('submitted_date', { ascending: false })
      .order('submitted_time', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reports', description: error.message });
    } else {
      setReports(data as Report[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel('employee_reports_db_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'employee_reports' },
        () => fetchReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  const addReport = async (stage: string, type: string, quantity: number): Promise<boolean> => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Log in to submit a report.' });
        return false;
    }

    const newReport = {
        employee_id: user.id,
        employee_name: user.name || user.email,
        submitted_date: getPKDate(),
        submitted_time: getPKTime(),
        stage,
        type,
        quantity,
    };

    const { error: reportError } = await supabase.from('employee_reports').insert(newReport);

    if (reportError) {
      toast({ variant: 'destructive', title: 'Failed to add report', description: reportError.message });
      return false;
    }

    toast({ title: 'Report Submitted', description: 'Your work has been logged successfully.' });
    return true;
  };

  const deleteReport = async (reportId: string) => {
    const { error } = await supabase.from('employee_reports').delete().eq('id', reportId);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    } else {
      toast({ title: 'Report Deleted', description: 'The report has been removed.' });
    }
  };

  return { reports, addReport, deleteReport, loading, fetchReports };
}