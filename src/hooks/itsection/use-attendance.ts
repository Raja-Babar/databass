'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Type definition including the new 'reason' field
export type AttendanceRecord = {
  id: number;
  employeeId: string;
  name: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Absent' | 'Leave' | 'Not Marked';
  reason?: string | null; // Added reason for leaves
};

export function useAttendance() {
  const { users } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  // --- Karachi Time Helpers ---
  const getKarachiDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()); // Returns YYYY-MM-DD
  };

  const getKarachiTime = () => {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()); // Returns HH:mm
  };

  // --- Fetch Records ---
  const fetchAttendanceRecords = useCallback(async () => {
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
          id: rec.id,
          employeeId: rec.user_id,
          name: matchedUser ? matchedUser.name : 'Unknown',
          date: rec.date,
          timeIn: rec.check_in,
          timeOut: rec.check_out,
          status: rec.status,
          reason: rec.reason, // Map from DB
        };
      });
      setAttendanceRecords(recordsWithNames as AttendanceRecord[]);
    }
  }, [users]);

  // --- Real-time Subscription ---
  useEffect(() => {
    fetchAttendanceRecords();
    const channel = supabase
      .channel('attendance_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendanceRecords();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAttendanceRecords]);

  // --- Main Actions (Clock In, Clock Out, Leave) ---
  const updateAttendance = async (
    userId: string, 
    actions: { clockIn?: boolean; clockOut?: boolean; markLeave?: boolean; reason?: string }
  ) => {
    const karachiDate = getKarachiDate();
    const karachiTime = getKarachiTime();

    if (actions.clockIn) {
      const { error } = await supabase.from('attendance').upsert({ 
          user_id: userId, 
          date: karachiDate,
          check_in: karachiTime,
          status: 'Present',
          reason: null // Reset reason if clocking in
      }, { onConflict: 'user_id,date' });

      if (error) {
        toast({ variant: 'destructive', title: 'Clock In Failed', description: error.message });
      } else {
        toast({ title: 'Clocked In', description: `Arrival recorded at ${karachiTime} PKT` });
      }

    } else if (actions.clockOut) {
      // Pehle check karein ke aaj ka clock-in hai ya nahi
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', userId)
        .eq('date', karachiDate)
        .single();

      if (!existing) {
        toast({ variant: 'destructive', title: 'Error', description: 'No Clock-in record found for today.' });
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .update({ check_out: karachiTime })
        .eq('id', existing.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Clock Out Failed', description: error.message });
      } else {
        toast({ title: 'Clocked Out', description: `Departure recorded at ${karachiTime} PKT` });
      }

    } else if (actions.markLeave) {
        const { error } = await supabase.from('attendance').upsert({
            user_id: userId,
            date: karachiDate,
            status: 'Leave',
            reason: actions.reason || 'No reason provided', // Save leave reason
            check_in: null,
            check_out: null,
        }, { onConflict: 'user_id,date' });

        if (error) {
            toast({ variant: 'destructive', title: 'Leave Request Failed', description: error.message });
        } else {
            toast({ title: 'Leave Marked', description: 'Your leave has been recorded successfully.' });
        }
    }
  };
  
  // --- Admin Correction Update ---
  const updateAttendanceRecord = async (
    employeeId: string, 
    date: string, 
    data: Partial<Omit<AttendanceRecord, 'employeeId' | 'date' | 'name'>>
  ) => {
    const backendData = {
        check_in: data.timeIn,
        check_out: data.timeOut,
        status: data.status,
        reason: data.reason,
    };

    const { error } = await supabase
        .from('attendance')
        .update(backendData)
        .match({ user_id: employeeId, date });

    if (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else {
        toast({ title: 'Success', description: 'Record updated successfully.' });
    }
  };

  // --- Delete Record ---
  const deleteAttendanceRecord = async (employeeId: string, date: string) => {
    const { error } = await supabase
        .from('attendance')
        .delete()
        .match({ user_id: employeeId, date });

    if (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } else {
        toast({ title: 'Deleted', description: 'Record removed successfully.' });
    }
  };

  return { 
    attendanceRecords, 
    updateAttendance, 
    updateAttendanceRecord, 
    deleteAttendanceRecord 
  };
}