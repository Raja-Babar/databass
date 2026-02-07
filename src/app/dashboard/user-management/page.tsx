'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr'; // Supabase Client
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Edit, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type UserRole = 'Admin' | 'I.T & Scanning-Employee' | 'Library-Employee' | 'Accounts';
type UserStatus = 'Approved' | 'Pending';

type UserProfile = {
  id: string; // Employee ID
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  user_id: string; // Supabase Auth ID
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Edit States
  const [editedId, setEditedId] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('I.T & Scanning-Employee');

  // --- Fetch Users ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      router.replace('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, router, fetchUsers]);

  // --- Filter Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // --- Actions ---
  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'Approved' })
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'User approved successfully.' });
      fetchUsers();
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('users')
      .update({ id: editedId, name: editedName, role: editedRole })
      .eq('user_id', selectedUser.user_id);

    if (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else {
      toast({ title: 'User Updated', description: 'Information saved.' });
      setIsEditDialogOpen(false);
      fetchUsers();
    }
  };

  const handleDelete = async (userId: string) => {
    // Note: Supabase Auth user delete requires Admin API (Edge Function),
    // but we can delete from public.users table for simple management.
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Deleted', description: 'User removed from record.' });
      fetchUsers();
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text('MHPISSJ-Portal Users Report', 14, 16);
    (doc as any).autoTable({
      head: [['ID', 'Name', 'Role', 'Email', 'Status']],
      body: filteredUsers.map(u => [u.id, u.name, u.role, u.email, u.status]),
      startY: 20,
      theme: 'grid'
    });
    doc.save('mhpissj_users_report.pdf');
  };

  // UI Helpers
  const getStatusVariant = (status: UserStatus) => status === 'Approved' ? 'secondary' : 'destructive';
  const getRoleBadgeVariant = (role: UserRole) => role === 'Admin' ? 'destructive' : 'default';

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage employee access and portal roles.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Portal Users</CardTitle>
              <CardDescription>Total {filteredUsers.length} users found.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, ID or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono">{u.id}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(u.status)}>{u.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.status === 'Pending' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(u.user_id)}>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(u.user_id)}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setSelectedUser(u);
                            setEditedId(u.id);
                            setEditedName(u.name);
                            setEditedRole(u.role);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" disabled={u.email === user.email}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>This will remove <b>{u.name}</b> from the portal records permanently.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(u.user_id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={editedId} onChange={(e) => setEditedId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Access Role</Label>
              <Select onValueChange={(v) => setEditedRole(v as UserRole)} defaultValue={editedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="I.T & Scanning-Employee">I.T & Scanning-Employee</SelectItem>
                  <SelectItem value="Library-Employee">Library-Employee</SelectItem>
                  <SelectItem value="Accounts">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}