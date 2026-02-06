// src/app/dashboard/user-management/page.tsx
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
  const { user, getUsers, deleteUser, updateUser, approveUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedId, setEditedId] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedRole, setEditedRole] = useState<UserRole>('I.T & Scanning-Employee');

  const allUsers = useMemo(() => {
    return getUsers();
  }, [getUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allUsers, searchTerm]);


  useEffect(() => {
    if (user?.role !== 'Admin') {
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
    setEditedId(userToEdit.id);
    setEditedName(userToEdit.name);
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
    switch (status) {
        case 'Approved':
            return 'secondary';
        case 'Pending':
            return 'destructive';
        default:
            return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
        case 'Admin':
            return 'destructive';
        case 'I.T & Scanning-Employee':
            return 'secondary';
        case 'Library-Employee':
            return 'default';
        case 'Accounts':
            return 'default';
        default:
            return 'secondary';
    }
  };


  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          View, export, and manage portal users.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all registered users in the system.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-col sm:flex-row">
                 <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search users..."
                        className="w-full rounded-lg bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="w-full md:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.email}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role)}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                   <TableCell>
                    <Badge variant={getStatusVariant(u.status)}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                      {user.role === 'Admin' && u.status === 'Pending' ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleApprove(u.email)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Approve
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="sm">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reject User</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to reject the user <span className="font-semibold">{u.name}</span>? This will delete their registration permanently.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReject(u.email)}>Reject</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)} disabled={u.email === 'admin@example.com'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={user.email === u.email || u.email === 'admin@example.com'}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete the user <span className="font-semibold">{u.name}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(u.email)}>Delete</AlertDialogAction>
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
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                ID
              </Label>
              <Input id="id" value={editedId} onChange={(e) => setEditedId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" value={selectedUser?.email || ''} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
               <Select onValueChange={(value) => setEditedRole(value as UserRole)} defaultValue={editedRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
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
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
