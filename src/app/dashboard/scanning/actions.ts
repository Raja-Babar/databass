'use server';

import { supabase } from '@/lib/supabase'; // Jo file humne banayi thi
import { ParseAndTranslateOutput } from '@/ai/flows/parse-bill-entry';
import { revalidatePath } from 'next/cache'; // Table ko foran update karne ke liye

export async function parseAndTranslate(title: string, author: string): Promise<{ success: boolean, data?: ParseAndTranslateOutput, error?: string }> {
  try {
    // 1. Data ko organize karein (Bypass AI)
    const result: ParseAndTranslateOutput = {
      titleEnglish: title,
      authorEnglish: author,
      titleSindhi: '', 
      authorSindhi: ''
    };

    // 2. SUPABASE QUERY: Data ko 'scanning_progress' table mein save karein
    const { error: supabaseError } = await supabase
      .from('scanning_progress')
      .insert([
        { 
          title_english: title, 
          author_english: author,
          book_id: `BK-${Date.now()}`, // Filhal unique ID ke liye timestamp use kiya hai
          status: 'Scanning',
          created_time: new Date().toISOString()
        }
      ]);

    if (supabaseError) {
      console.error('Supabase Insert Error:', supabaseError.message);
      return { success: false, error: 'Database mein save nahi ho saka.' };
    }

    // 3. Page ko refresh karein taake naya data table mein nazar aaye
    revalidatePath('/dashboard/scanning');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error in saving process:', error);
    return { success: false, error: 'Failed to process details.' };
  }
}