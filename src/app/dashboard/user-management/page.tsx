'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Edit, CheckCircle, XCircle, Search } from 'lucide-react';
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

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
};

export default function UserManagementPage() {
  // FIX: getUsers ki jagah 'users' array use karein
  const { user, users, deleteUser, updateUser, approveUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedId, setEditedId] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('I.T & Scanning-Employee');

  // Logic to handle user data safely
  const allUsers = useMemo(() => {
    return users || []; // Agar users undefined ho to empty array return kare
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  const handleExport = () => {
    const doc = new jsPDF();
    doc.text('MHPISSJ-Portal Users Report', 14, 16);
    (doc as any).autoTable({
        head: [['ID', 'Employee Name', 'Role', 'Email', 'Status']],
        body: filteredUsers.map(u => [u.id, u.name, u.role, u.email, u.status]),
        startY: 20
    });
    doc.save('mhpissj_portal_users.pdf');
    toast({ title: 'Success', description: 'User data exported successfully as PDF.' });
  };

  const handleDelete = async (email: string) => {
    if (user?.email === email) {
      toast({ variant: 'destructive', title: 'Action Forbidden', description: 'You cannot delete your own account.' });
      return;
    }
    await deleteUser(email);
    toast({ title: 'User Deleted', description: 'The user has been successfully deleted.' });
  };
  
  const handleReject = async (email: string) => {
    if (user?.email === email) {
      toast({ variant: 'destructive', title: 'Action Forbidden', description: 'You cannot reject your own account.' });
      return;
    }
    await deleteUser(email);
    toast({ title: 'User Rejected', description: 'The user registration has been rejected and deleted.' });
  };

  const handleEditClick = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditedId(userToEdit.id || '');
    setEditedName(userToEdit.name || '');
    setEditedRole(userToEdit.role);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = async () => {
    if (selectedUser) {
      if (selectedUser.email === 'admin@example.com' && editedRole !== 'Admin') {
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Cannot change the role of the primary admin.' });
          return;
      }
      await updateUser(selectedUser.email, { id: editedId, name: editedName, role: editedRole });
      toast({ title: 'User Updated', description: 'User information has been updated.' });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  const handleApprove = async (email: string) => {
    await approveUser(email);
    toast({ title: 'User Approved', description: 'The user has been approved and can now log in.' });
  };

  const getStatusVariant = (status: UserStatus) => {
    return status === 'Approved' ? 'secondary' : 'destructive';
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
        case 'Admin': return 'destructive';
        case 'I.T & Scanning-Employee': return 'secondary';
        case 'Library-Employee': return 'default';
        case 'Accounts': return 'default';
        default: return 'outline';
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage portal users and approvals.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
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
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell>{u.id}</TableCell>
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
                          <Button variant="outline" size="sm" onClick={() => handleApprove(u.email)}>
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleReject(u.email)}>
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)} disabled={u.email === 'admin@example.com'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.email)} disabled={u.email === user.email}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog remains mostly same but with safe checks */}
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
              <Label>Role</Label>
              <Select onValueChange={(v) => setEditedRole(v as UserRole)} defaultValue={editedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
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
            <Button onClick={handleUpdate}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}