'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

/**
 * A custom hook to manage records in the 'scanning_records' table.
 * It provides functions to fetch, add, update, and delete records.
 */
export function useDigitization() {
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches all records from the database.
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scanning_records')
      .select('*')
      .order('created_time', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error Fetching Records', description: error.message });
      setRecords([]);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [toast]);

  // Initial fetch and real-time subscription setup.
  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel('public:scanning_records')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scanning_records' }, 
        (payload) => {
          // When any change occurs, just refetch all the data to keep the UI in sync.
          fetchRecords();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  /**
   * Adds a new record or updates an existing one if a matching book_id is found.
   * This function is used for both creating new entries and for assigning tasks.
   */
  const addRecord = async (record: any) => {
    const { error } = await supabase.from('scanning_records').upsert(record, { onConflict: 'book_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Database Error', description: error.message });
    }
    // Success toast is handled in the component for better context.
    return { error };
  };

  /**
   * Deletes a record from the database based on its book_id.
   */
  const deleteRecord = async (book_id: string) => {
    const { error } = await supabase.from('scanning_records').delete().eq('book_id', book_id);

    if (error) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } else {
        toast({ title: 'Success', description: 'Record has been deleted.' });
    }
    return { error };
  };

  return { records, loading, addRecord, deleteRecord };
}
