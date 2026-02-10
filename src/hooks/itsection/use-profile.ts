'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const updateProfile = async (userId: string, formData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          nic: formData.nic,
          dob: formData.dob,
          dot: formData.dot,
          bank_name: formData.bank_name,
          bank_details: formData.bank_details,
          emergency: formData.emergency,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      await refreshUser();
      return { success: true };
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading };
}