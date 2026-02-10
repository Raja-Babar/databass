'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export function useDigitization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. FETCH DATA ---
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('digitization_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fetch Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // --- 2. FIXED 3-HYPHEN SMART PARSING LOGIC ---
  const parseFileName = useCallback((fileName: string) => {
    if (!fileName) return { book: '', author: 'unknown', year: 'unknown' };
    
    // Sirf dash (-) se split karein
    const parts = fileName.split('-').map(p => p.trim());
    
    // Step 1: Book Name (Hamesha pehla part, underscores ko space mein badlein)
    const book = parts[0] ? parts[0].replace(/_/g, ' ') : '';
    
    let author = 'unknown';
    let year = 'unknown';

    // Step 2: 2nd Part Check (Author ya Year)
    if (parts[1]) {
      // Agar 2nd part sirf number hai, toh author unknown aur ye part year ban jayega
      if (/^\d+$/.test(parts[1])) {
        author = 'unknown';
        year = parts[1];
      } else {
        // Agar text hai toh underscores hata kar author set karein
        author = parts[1].replace(/_/g, ' ');
      }
    }

    // Step 3: 3rd Part Check (Year)
    // Agar year pehle set nahi hua aur ye number hai toh set karein
    if (parts[2] && /^\d+$/.test(parts[2])) {
      year = parts[2];
    }

    return { book, author, year };
  }, []);

  // --- 3. IMPORT LOGIC WITH STRENGTHENED DUPLICATE CHECK ---
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'ods', 'xls'].includes(fileExt || '')) {
      toast({ variant: "destructive", title: "Invalid File" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

        // DATABASE SE DUPLICATES CHECK KARNA
        const { data: existingData } = await supabase
          .from('digitization_records')
          .select('file_name');
        
        const existingFilesSet = new Set(existingData?.map(r => r.file_name?.trim().toLowerCase()) || []);

        const formattedData = rawData.map((item: any) => {
          // Excel ke column names check karein (File Name ya file_name)
          const rawFileName = item['File Name'] || item.file_name || '';
          const fileName = rawFileName.trim();
          
          if (!fileName) return null;

          const parsed = parseFileName(fileName);

          return {
            file_name: fileName,
            book_name: item['Book Name'] || item.book_name || parsed.book,
            author_name: item['Author Name'] || item.author_name || parsed.author,
            year: item['Year'] || item.year || parsed.year,
            stage: item['Stage'] || item.stage || 'Pending',
            created_by: user?.id,
            last_edited_by: user?.id,
          };
        }).filter(row => 
          row !== null && 
          !existingFilesSet.has(row.file_name.toLowerCase()) // Duplicate filter
        );

        if (formattedData.length === 0) {
          toast({ 
            title: "No new records", 
            description: "Duplicate files detected. Nothing to add." 
          });
          return;
        }

        const { error } = await supabase.from('digitization_records').insert(formattedData);
        if (error) throw error;

        toast({ title: "Success", description: `${formattedData.length} records imported.` });
        fetchRecords(); 
      } catch (err: any) {
        toast({ variant: "destructive", title: "Import Failed", description: err.message });
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  // --- 4. SEARCH FILTER ---
  const filteredRecords = records.filter(r => 
    r.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.book_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    records: filteredRecords,
    loading,
    searchTerm,
    setSearchTerm,
    handleImport,
    refreshData: fetchRecords,
    parseFileName
  };
}