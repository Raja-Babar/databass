'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export type EmployeeReport = {
    id: string;
    employee_id: string;
    employee_name: string;
    submitted_date: string;
    stage: string;
    type: string;
    quantity: number;
};

export function useReports() {
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const { toast } = useToast();

  const fetchEmployeeReports = useCallback(async () => {
    const { data, error } = await supabase.from('employee_reports').select('*');
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reports', description: error.message });
    } else {
      setEmployeeReports(data as EmployeeReport[]);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployeeReports();

    const channel = supabase
      .channel('employee_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_reports' }, 
        () => fetchEmployeeReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmployeeReports]);

  const addEmployeeReport = async (report: Omit<EmployeeReport, 'id'>) => {
      const newId = `REP-${Date.now()}`;
      const { error } = await supabase.from('employee_reports').insert([{ ...report, id: newId }]);
      if (error) toast({ variant: 'destructive', title: 'Error', description: 'Could not add report.' });
      else toast({ title: 'Success', description: 'Report added.' });
  };

  const updateEmployeeReport = async (reportId: string, data: Partial<Omit<EmployeeReport, 'id'>>) => {
      const { error } = await supabase.from('employee_reports').update(data).eq('id', reportId);
      if (error) toast({ variant: 'destructive', title: 'Error', description: 'Could not update report.' });
      else toast({ title: 'Success', description: 'Report updated.' });
  };

  const deleteEmployeeReport = async (reportId: string) => {
      const { error } = await supabase.from('employee_reports').delete().eq('id', reportId);
      if (error) toast({ variant: 'destructive', title: 'Error', description: 'Could not delete report.' });
      else toast({ title: 'Success', description: 'Report deleted.' });
  };

  return {
    employeeReports,
    fetchEmployeeReports,
    addEmployeeReport,
    updateEmployeeReport,
    deleteEmployeeReport,
  };
}
