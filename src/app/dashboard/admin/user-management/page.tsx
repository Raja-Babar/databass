'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/admin/use-user-management'; // Naya hook
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Edit, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type UserRole = 'Admin' | 'I.T & Scanning-Employee' | 'Library-Employee' | 'Accounts';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { users, loading, approveUser, deleteUser, updateUser } = useUsers();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editedName, setEditedName] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('I.T & Scanning-Employee');

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Auth Guard: Sirf Admin hi is page par reh sakta hai
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text('MHPISSJ-Portal Users Report', 14, 16);
    (doc as any).autoTable({
        head: [['Name', 'Role', 'Email', 'Status']],
        body: filteredUsers.map(u => [u.name, u.role, u.email, u.status]),
        startY: 20
    });
    doc.save('portal_users.pdf');
    toast({ title: 'Exported', description: 'PDF has been downloaded.' });
  };

  const handleEditClick = (u: any) => {
    setSelectedUser(u);
    setEditedName(u.name);
    setEditedRole(u.role as UserRole);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSave = async () => {
    if (selectedUser) {
      // Primary Admin check
      if (selectedUser.email === 'admin@example.com' && editedRole !== 'Admin') {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot change Primary Admin role.' });
        return;
      }
      await updateUser(selectedUser.id, { name: editedName, role: editedRole });
      setIsEditDialogOpen(false);
    }
  };

  if (!currentUser || currentUser.role !== 'Admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage employee approvals and roles.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'Admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'Approved' ? 'default' : 'outline'}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.status === 'Pending' ? (
                        <>
                          <Button size="sm" onClick={() => approveUser(u.id)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>Reject</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)} disabled={u.email === 'admin@example.com'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} disabled={u.id === currentUser.id}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User Profile</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select onValueChange={(v) => setEditedRole(v as UserRole)} value={editedRole}>
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
            <Button onClick={handleUpdateSave}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}