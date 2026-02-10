'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export type AttendanceRecord = {
  id: number;
  employeeId: string;
  name: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Absent' | 'Leave' | 'Not Marked';
  reason?: string | null;
};

export function useAttendance() {
  const { user } = useAuth(); 
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Karachi Time Helpers
  const getKarachiDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  const getKarachiTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

  // --- Fetch ONLY Current User Records ---
  const fetchMyRecords = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id) // Sirf apna data
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance:', error);
    } else if (data) {
      const formatted = data.map(rec => ({
        id: rec.id,
        employeeId: rec.user_id,
        name: user.name || 'Me', 
        date: rec.date,
        timeIn: rec.check_in,
        timeOut: rec.check_out,
        status: rec.status,
        reason: rec.reason,
      }));
      setAttendanceRecords(formatted as AttendanceRecord[]);
    }
    setLoading(false);
  }, [user]);

  // Real-time updates
  useEffect(() => {
    fetchMyRecords();

    if (!user?.id) return;

    const channel = supabase
      .channel(`attendance_user_${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance', 
          filter: `user_id=eq.${user.id}` 
        }, 
        () => fetchMyRecords()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchMyRecords]);

  // --- Actions ---
  const updateAttendance = async (actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean; reason?: string }) => {
    if (!user?.id) return;

    const karachiDate = getKarachiDate();
    const karachiTime = getKarachiTime();

    try {
      if (actions.clockIn) {
        // Clock In: Naya record banaye ga ya update karega agar aaj ka exist karta hai
        const { error } = await supabase.from('attendance').upsert({ 
          user_id: user.id, 
          date: karachiDate,
          check_in: karachiTime,
          status: 'Present'
        }, { onConflict: 'user_id,date' });

        if (error) throw error;
        toast({ title: 'Clocked In', description: `Recorded at ${karachiTime}` });

      } else if (actions.clockOut) {
        // Clock Out: Aaj ke record mein check_out time dalega
        const { error } = await supabase.from('attendance')
          .update({ check_out: karachiTime })
          .match({ user_id: user.id, date: karachiDate });

        if (error) throw error;
        toast({ title: 'Clocked Out', description: `Recorded at ${karachiTime}` });

      } else if (actions.markLeave) {
        // Leave: Status change karega
        const { error } = await supabase.from('attendance').upsert({
          user_id: user.id,
          date: karachiDate,
          status: 'Leave',
          reason: actions.reason || 'No reason provided'
        }, { onConflict: 'user_id,date' });

        if (error) throw error;
        toast({ title: 'Leave Marked', description: 'Your leave has been recorded.' });
      }
      
      fetchMyRecords();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: err.message });
    }
  };

  return { 
    attendanceRecords, 
    loading,
    updateAttendance,
    refresh: fetchMyRecords 
  };
}