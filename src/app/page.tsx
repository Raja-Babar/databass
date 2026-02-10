'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkRedirect = async () => {
      // 1. Check karein ke session hai ya nahi
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 2. Agar login hai, toh dashboard par bhejein
        router.replace('/dashboard');
      } else {
        // 3. Agar login nahi hai, toh default login par bhejein
        router.replace('/login');
      }
    };

    checkRedirect();
  }, [router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner for smooth transition */}
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Loading MHPISSJ Portal...
        </p>
      </div>
    </div>
  );
}