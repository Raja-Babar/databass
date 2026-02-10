'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, appLogo } = useAuth();
  const router = useRouter();
  
  // Local state taaki humein pata chale ke pehli baar loading ho chuki hai
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setInitialCheckDone(true);
      if (!user) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // --- FIX: Sirf tab loading dikhao jab user na ho AUR pehli baar load ho raha ho ---
  if (isLoading && !initialCheckDone && !user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <ShieldCheck className="h-12 w-12 animate-pulse text-indigo-600" />
          <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 animate-spin text-indigo-400" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-bold tracking-tight">MHPISSJ Portal</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // Agar user nahi hai toh kuch render mat karo (redirect ho raha hai)
  if (!user && initialCheckDone) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-sidebar-border">
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 shadow-sm">
                <Image 
                  src={appLogo || "/logo.png"} 
                  alt="Logo" 
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-slate-800">
                MHPISSJ-Portal
              </span>
            </div>
          </div>
          <DashboardNav />
        </div>
      </Sidebar>

      <SidebarInset className="flex flex-col bg-slate-50/30">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-slate-100 transition-colors" />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <UserNav />
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 transition-all duration-300">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}