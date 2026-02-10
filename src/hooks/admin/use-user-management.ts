'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_approved: boolean;
  status: 'Approved' | 'Pending';
  created_at: string;
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 1. Fetch All Users (Admin Action)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data.map((u: any) => ({
        ...u,
        status: u.is_approved ? 'Approved' : 'Pending'
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Fetch Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 2. Approve User
  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: 'User Approved', description: 'Employee can now login.' });
      // State update filter handle karega ya fetchUsers call karein
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // 3. Update User (Name aur Role change karne ke liye)
  const updateUser = async (userId: string, updates: { name: string, role: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: updates.name, 
          role: updates.role 
        })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: 'User Updated', description: 'Changes saved successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };

  // 4. Delete User
  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      toast({ title: 'User Removed', description: 'User has been deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // 5. Real-time Subscription (Jab bhi profile table change ho, data refresh ho jaye)
  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('admin_user_management')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          fetchUsers(); // Kuch bhi change ho toh fresh data le aao
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  return { users, loading, refresh: fetchUsers, approveUser, deleteUser, updateUser };
};