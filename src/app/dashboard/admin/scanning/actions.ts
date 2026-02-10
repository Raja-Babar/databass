'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface ParseAndTranslateOutput {
  titleEnglish: string;
  authorEnglish: string;
  titleSindhi: string;
  authorSindhi: string;
  year?: string;
}

/**
 * 1. PARSE FILENAME LOGIC
 * File name se data nikalta hai aur Sindhi/English detect karta hai
 */
export async function parseAndTranslate(
  fileName: string
): Promise<{ success: boolean, data?: ParseAndTranslateOutput, error?: string }> {
  try {
    if (!fileName) return { success: false, error: 'File name is required.' };

    const cleanFileName = fileName.replace(/\.[^/.]+$/, ""); 
    const parts = cleanFileName.split('-').map(p => p.replace(/_/g, ' ').trim());
    
    const rawTitle = parts[0] || cleanFileName;
    const rawAuthor = parts[1] || '';
    const rawYear = parts[2] || '';

    const isSindhi = (text: string) => /[\u0600-\u06FF]/.test(text);

    const result: ParseAndTranslateOutput = {
      titleEnglish: !isSindhi(rawTitle) ? rawTitle : '',
      titleSindhi: isSindhi(rawTitle) ? rawTitle : '',
      authorEnglish: (rawAuthor && !isSindhi(rawAuthor)) ? rawAuthor : '',
      authorSindhi: (rawAuthor && isSindhi(rawAuthor)) ? rawAuthor : '',
      year: rawYear
    };

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 2. UPSERT RECORD (ADD OR UPDATE)
 * Database mein naya record dalta hai ya purane ko update karta hai
 */
export async function upsertScanningRecord(record: any) {
  try {
    const { error } = await supabase
      .from('scanning_records')
      .upsert([record], { onConflict: 'book_id' }); // Agar book_id match kare to update kar do

    if (error) throw error;

    revalidatePath('/dashboard/scanning');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Database Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 3. DELETE RECORD
 * Database se record delete karta hai
 */
export async function deleteScanningRecord(book_id: string) {
  try {
    const { error } = await supabase
      .from('scanning_records')
      .delete()
      .eq('book_id', book_id);

    if (error) throw error;

    revalidatePath('/dashboard/scanning');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}