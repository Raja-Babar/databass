'use client';

import { useState, useEffect } from 'react';
import { useDigitization } from '@/hooks/itsection/use-digitization';
import { useAuth } from '@/hooks/use-auth';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { 
  Download, Upload, Search, MoreVertical, FileText, PlusCircle, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function GlobalLibraryPage() {
  const { user } = useAuth();
  const { 
    records, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    handleImport, 
    refreshData, 
    parseFileName 
  } = useDigitization();
  
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Manual Entry State
  const [formData, setFormData] = useState({
    file_name: '',
    book_name: '',
    author_name: '',
    year: '',
    stage: 'Pending'
  });

  // Sync Parsing with Input
  useEffect(() => {
    if (formData.file_name) {
      const parsed = parseFileName(formData.file_name);
      setFormData(prev => ({
        ...prev,
        book_name: parsed.book,
        author_name: parsed.author,
        year: parsed.year
      }));
    }
  }, [formData.file_name, parseFileName]);

  // --- MANUAL SUBMIT WITH STRICT DUPLICATE CHECK ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const cleanFileName = formData.file_name.trim();

    try {
      // 1. DUPLICATE CHECK (Case Insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('digitization_records')
        .select('file_name')
        .ilike('file_name', cleanFileName) 
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast({
          variant: "destructive",
          title: "Duplicate Entry!",
          description: `The file "${cleanFileName}" already exists in the records.`,
        });
        setSubmitting(false);
        return;
      }

      // 2. INSERT
      const { error: insertError } = await supabase
        .from('digitization_records')
        .insert([{
          ...formData,
          file_name: cleanFileName,
          created_by: user.id,
          last_edited_by: user.id
        }]);

      if (insertError) throw insertError;

      // 3. SUCCESS
      toast({ title: "Success", description: "Book recorded successfully!" });
      setOpen(false);
      setFormData({ file_name: '', book_name: '', author_name: '', year: '', stage: 'Pending' });
      
      if (refreshData) await refreshData();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Digitization Hub</h1>
          <p className="text-slate-500 font-medium italic">Global library view and smart management.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg gap-2 transition-all active:scale-95">
              <PlusCircle className="h-5 w-5" /> Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-slate-800 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-500" /> Smart Entry
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Paste File Name</label>
                <Input 
                  required 
                  value={formData.file_name} 
                  onChange={(e) => setFormData({...formData, file_name: e.target.value})} 
                  placeholder="Book_Name-Author-2001-org" 
                  className="rounded-xl border-2 h-12 focus:ring-indigo-500" 
                />
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Auto-Detected Book</label>
                  <p className="font-bold text-slate-700 break-words">{formData.book_name || 'Waiting...'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Author</label>
                    <p className={cn("font-bold truncate", formData.author_name === 'اڻڄاتل' ? "text-slate-400" : "text-slate-700")}>
                      {formData.author_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Year</label>
                    <p className={cn("font-bold font-mono", formData.year === 'اڻڄاتل' ? "text-slate-400" : "text-slate-700")}>
                      {formData.year}
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-slate-900 h-12 rounded-xl font-black uppercase tracking-wider shadow-lg">
                {submitting ? "Checking & Saving..." : "Confirm & Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by File, Book, or Author..." 
            className="pl-10 rounded-xl focus-visible:ring-indigo-500 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild className="rounded-xl gap-2 cursor-pointer hover:bg-slate-50 border-slate-200">
            <label>
              <Upload className="h-4 w-4 text-slate-500" /> 
              <span className="font-semibold text-slate-600">Import</span>
              <input type="file" accept=".csv, .xlsx, .ods" className="hidden" onChange={handleImport} disabled={loading} />
            </label>
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 hover:bg-slate-50 border-slate-200 font-semibold text-slate-600">
            <Download className="h-4 w-4 text-slate-500" /> <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">File Name</TableHead>
                <TableHead className="font-bold text-slate-700">Book Name</TableHead>
                <TableHead className="font-bold text-slate-700">Author</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Year</TableHead>
                <TableHead className="font-bold text-slate-700">Stage</TableHead>
                <TableHead className="font-bold text-slate-700">Assignee</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Deadline</TableHead>
                <TableHead className="font-bold text-slate-700">Scan/Digit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-indigo-600 font-bold animate-pulse">Syncing Library...</TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-slate-400 italic">No records found.</TableCell>
                </TableRow>
              ) : records.map((record) => (
                <TableRow key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-indigo-600 max-w-[200px] truncate">{record.file_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-semibold text-slate-800">{record.book_name}</TableCell>
                  <TableCell className={cn("max-w-[130px] truncate", record.author_name === 'اڻڄاتل' ? "text-slate-300" : "text-slate-600")}>
                    {record.author_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn("font-mono", record.year === 'اڻڄاتل' && "opacity-30")}>
                      {record.year}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-black uppercase text-[10px]",
                      record.stage === 'Completed' ? "bg-emerald-500" : record.stage === 'Scanning' ? "bg-blue-500" : "bg-amber-400"
                    )}>
                      {record.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.assignee || '---'}</TableCell>
                  <TableCell className="text-center text-[11px] font-bold text-slate-400">{record.deadline || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[9px] font-black uppercase">
                      <span className="text-slate-400">S: {record.scanned_by || '-'}</span>
                      <span className="text-indigo-400">D: {record.digitized_by || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}