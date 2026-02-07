'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getScanningRecords, addScanningRecord, updateScanningRecord, deleteScanningRecord } from './actions';

// Data types
type ScanningRecord = {
  book_id: string;
  file_name: string;
  book_name: string;
  author_name: string;
  year: string;
  status: string;
  source: string;
  scanned_by: string | null;
  digitized_by: string | null;
  assigned_to: string | null;
  created_time: string;
  last_edited_time: string;
  last_edited_by: string | null;
};

const recordSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  book_name: z.string().min(1, 'Book name is required'),
  author_name: z.string().min(1, 'Author is required'),
  year: z.string().min(4, 'Invalid year').max(4, 'Invalid year'),
  source: z.string().min(1, 'Source is required'),
  status: z.string().default('Pending'),
  scanned_by: z.string().optional().nullable(),
  digitized_by: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
});

const stages = ['Pending', 'Scanned', 'Digitized', 'Uploaded', 'Live', 'org']; // Added 'org' from your example

export default function ScanningPage() {
  const { user, users = [] } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScanningRecord | null>(null);
  const [filter, setFilter] = useState('');

  const { data: records = [], mutate, error, isLoading } = useSWR('scanning_records', getScanningRecords);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<z.infer<typeof recordSchema>>({
    resolver: zodResolver(recordSchema),
    defaultValues: { file_name: '', book_name: '', author_name: '', year: '', source: '' },
  });

  // FIX: Correctly parse file name and update form state using setValue
  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setValue('file_name', name); // Update the file_name field itself

    const parts = name.split('-');
    if (parts.length >= 3) {
      const [book, author, year, stage] = parts;
      setValue('book_name', book.replace(/_/g, ' '), { shouldValidate: true });
      setValue('author_name', author.replace(/_/g, ' '), { shouldValidate: true });
      setValue('year', year, { shouldValidate: true });
      if (stage) {
        setValue('status', stage, { shouldValidate: true });
      }
    }
  };

  const filteredRecords = useMemo(() => {
    if (!filter) return records;
    return records.filter(rec => Object.values(rec).some(val => String(val).toLowerCase().includes(filter.toLowerCase())));
  }, [records, filter]);

  const onAddSubmit = async (data: z.infer<typeof recordSchema>) => {
    if (!user) return toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
    const res = await addScanningRecord({ ...data, last_edited_by: user.full_name });
    if (res.success) {
      toast({ title: 'Success', description: 'Record added successfully.' });
      mutate();
      setAddDialogOpen(false);
      reset();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const onEditSubmit = async (data: z.infer<typeof recordSchema>) => {
    if (!editingRecord || !user) return;
    const res = await updateScanningRecord(editingRecord.book_id, { ...data, last_edited_by: user.full_name });
    if (res.success) {
      toast({ title: 'Success', description: 'Record updated successfully.' });
      mutate();
      setEditingRecord(null);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const onDelete = async (book_id: string) => {
    const res = await deleteScanningRecord(book_id);
    if (res.success) {
      toast({ title: 'Success', description: 'Record deleted.' });
      mutate();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  if (isLoading) return <div>Loading records...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Scanning Progress</h1>
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-sm" />
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); reset(); }}>
          <DialogTrigger asChild><Button>Add New Record</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Scanning Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
              <Input {...register('file_name')} placeholder="Book_Name-Author-Year-Stage" onChange={handleFileNameChange} />
              {errors.file_name && <p className="text-red-500 text-sm">{errors.file_name.message}</p>}
              <Input {...register('book_name')} placeholder="Book Name" />
              {errors.book_name && <p className="text-red-500 text-sm">{errors.book_name.message}</p>}
              <Input {...register('author_name')} placeholder="Author Name" />
              {errors.author_name && <p className="text-red-500 text-sm">{errors.author_name.message}</p>}
              <Input {...register('year')} placeholder="Year" />
              {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
              <Input {...register('source')} placeholder="Source" />
              {errors.source && <p className="text-red-500 text-sm">{errors.source.message}</p>}
              <DialogFooter><Button type="submit">Add Record</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>File Name</TableHead><TableHead>Book Name</TableHead><TableHead>Author</TableHead>
            <TableHead>Year</TableHead><TableHead>Stage</TableHead><TableHead>Source</TableHead>
            <TableHead>Scanned By</TableHead><TableHead>Digitized By</TableHead><TableHead>Assignee</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.book_id}>
                <TableCell>{record.file_name}</TableCell><TableCell>{record.book_name}</TableCell>
                <TableCell>{record.author_name}</TableCell><TableCell>{record.year}</TableCell>
                <TableCell>{record.status}</TableCell><TableCell>{record.source}</TableCell>
                <TableCell>{record.scanned_by}</TableCell><TableCell>{record.digitized_by}</TableCell>
                <TableCell>{record.assigned_to}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingRecord(record); reset(record); }}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(record.book_id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingRecord} onOpenChange={(isOpen) => !isOpen && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Record</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <Input {...register('file_name')} placeholder="File Name" />
            <Input {...register('book_name')} placeholder="Book Name" />
            <Input {...register('author_name')} placeholder="Author Name" />
            <Input {...register('year')} placeholder="Year" />
            <Input {...register('source')} placeholder="Source" />
            <Select onValueChange={(v) => setValue('status', v, { shouldValidate: true })} defaultValue={control._formValues.status}>
              <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
              <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(v) => setValue('scanned_by', v)} defaultValue={control._formValues.scanned_by || ''}>
              <SelectTrigger><SelectValue placeholder="Scanned By" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(v) => setValue('digitized_by', v)} defaultValue={control._formValues.digitized_by || ''}>
              <SelectTrigger><SelectValue placeholder="Digitized By" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(v) => setValue('assigned_to', v)} defaultValue={control._formValues.assigned_to || ''}>
              <SelectTrigger><SelectValue placeholder="Assign To" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
