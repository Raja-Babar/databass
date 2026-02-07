'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Simplified ScanningRecord type based on your new requirements
type ScanningRecord = {
  book_id: string;
  file_name: string;
  book_name: string; // Replaces title_english
  author_name: string; // Replaces author_english
  year: string;
  status: string; // This is your 'Stage' column
  source: string;
  scanned_by: string | null;
  digitized_by: string | null; // New field
  assigned_to: string | null; // This is your 'Asignee'
  created_time: string;
  last_edited_time: string;
  last_edited_by: string | null;
};

export async function getScanningRecords() {
    // Selecting specific columns to match the new structure
    const { data, error } = await supabase
        .from('scanning_progress')
        .select('book_id, file_name, book_name, author_name, year, status, source, scanned_by, digitized_by, assigned_to, created_time, last_edited_time, last_edited_by')
        .order('created_time', { ascending: false });

    if (error) {
        console.error('Error fetching records:', error);
        throw new Error(`Could not fetch scanning records: ${error.message}`);
    }
    return data as ScanningRecord[];
}

// The record passed in should not contain book_id, created_time, or last_edited_time
export async function addScanningRecord(record: Omit<ScanningRecord, 'book_id' | 'created_time' | 'last_edited_time'>) {
    const now = new Date().toISOString();
    const newRecord = {
        ...record,
        created_time: now,
        last_edited_time: now,
    };

    const { data, error } = await supabase.from('scanning_progress').insert([newRecord]).select().single();

    if (error) {
        console.error('Error adding record:', error);
        return { success: false, error: error.message };
    }
    revalidatePath('/dashboard/scanning');
    return { success: true, data };
}

export async function updateScanningRecord(book_id: string, updates: Partial<ScanningRecord>) {
    const { data, error } = await supabase
        .from('scanning_progress')
        .update({ ...updates, last_edited_time: new Date().toISOString() })
        .eq('book_id', book_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating record:', error);
        return { success: false, error: error.message };
    }
    revalidatePath('/dashboard/scanning');
    return { success: true, data };
}

export async function deleteScanningRecord(book_id: string) {
    const { error } = await supabase.from('scanning_progress').delete().eq('book_id', book_id);
    if (error) {
        console.error('Error deleting record:', error);
        return { success: false, error: error.message };
    }
    revalidatePath('/dashboard/scanning');
    return { success: true };
}
