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

  // --- Fetch ONLY My Reports ---
  const fetchMyReports = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('employee_reports')
      .select('*')
      .eq('employee_id', user.id) // Sirf apni ID filter karein
      .order('submitted_date', { ascending: false })
      .order('submitted_time', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reports', description: error.message });
    } else {
      setReports(data as Report[]);
    }
    setLoading(false);
  }, [user?.id, toast]);

  // --- Real-time updates for THIS user only ---
  useEffect(() => {
    fetchMyReports();

    if (!user?.id) return;

    const channel = supabase
      .channel(`my_reports_${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'employee_reports',
          filter: `employee_id=eq.${user.id}` // Real-time mein bhi sirf apni reports ka wait karein
        },
        () => fetchMyReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyReports, user?.id]);

  // --- Add Report ---
  const addReport = async (stage: string, type: string, quantity: number, customDate?: string): Promise<boolean> => {
    if (!user?.id) return false;

    const newReport = {
        employee_id: user.id,
        employee_name: user.name || user.email,
        submitted_date: customDate || getPKDate(),
        submitted_time: getPKTime(),
        stage,
        type,
        quantity,
    };

    const { error } = await supabase.from('employee_reports').insert(newReport);

    if (error) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
      return false;
    }

    toast({ title: 'Success', description: 'Work logged successfully.' });
    return true;
  };

  // --- Delete My Report ---
  const deleteReport = async (reportId: string) => {
    // Delete query mein bhi filter lagaya hai security ke liye
    const { error } = await supabase
      .from('employee_reports')
      .delete()
      .eq('id', reportId)
      .eq('employee_id', user?.id); 

    if (error) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } else {
      toast({ title: 'Deleted', description: 'Report removed.' });
    }
  };

  return { reports, addReport, deleteReport, loading, refresh: fetchMyReports };
}