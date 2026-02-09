'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export type AttendanceRecord = {
  user_id: string; // Changed from employee_id
  name: string;
  date: string;
  check_in: string | null; // Changed from time_in
  check_out: string | null; // Changed from time_out
  status: 'Present' | 'Absent' | 'Leave' | 'Not Marked';
};

export function useAttendance() {
  const { users } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  const fetchAttendanceRecords = useCallback(async () => {
    // Users load hone ka intezar karein takay names map ho saken
    if (!users || users.length === 0) return;

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance:', error);
    } else if (data) {
      const recordsWithNames = data.map(rec => {
        const matchedUser = users.find(u => String(u.id) === String(rec.user_id));
        return {
          ...rec,
          name: matchedUser ? matchedUser.name : 'Unknown',
          // Backend columns ko frontend fields mein map karna
          check_in: rec.check_in,
          check_out: rec.check_out,
        };
      });
      setAttendanceRecords(recordsWithNames as AttendanceRecord[]);
    }
  }, [users]);

  // Initial load and Real-time subscription
  useEffect(() => {
    fetchAttendanceRecords();

    const channel = supabase
      .channel('attendance_db_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => { fetchAttendanceRecords(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAttendanceRecords]);

  // Clock In/Out Logic
  const updateAttendance = async (userId: string, actions: { clockIn?: boolean; clockOut?: boolean }) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

    if (actions.clockIn) {
      const { error } = await supabase.from('attendance').upsert({ 
          user_id: userId, 
          date: today, 
          check_in: time, 
          status: 'Present' 
      }, { onConflict: 'user_id,date' });

      if (error) toast({ variant: 'destructive', title: 'Clock In Failed', description: error.message });
      else toast({ title: 'Success', description: 'Clocked in at ' + time });

    } else if (actions.clockOut) {
      const { error } = await supabase
        .from('attendance')
        .update({ check_out: time })
        .match({ user_id: userId, date: today });

      if (error) toast({ variant: 'destructive', title: 'Clock Out Failed', description: error.message });
      else toast({ title: 'Success', description: 'Clocked out at ' + time });
    }
  };
  
  const updateAttendanceRecord = async (userId: string, date: string, data: any) => {
    const { error } = await supabase
        .from('attendance')
        .update(data)
        .match({ user_id: userId, date });
    
    if (error) toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    else toast({ title: 'Success', description: 'Record updated successfully.' });
  };

  const deleteAttendanceRecord = async (userId: string, date: string) => {
    const { error } = await supabase
        .from('attendance')
        .delete()
        .match({ user_id: userId, date });
        
    if (error) toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
  };

  return {
    attendanceRecords,
    fetchAttendanceRecords,
    updateAttendance,
    updateAttendanceRecord,
    deleteAttendanceRecord,
  };
}