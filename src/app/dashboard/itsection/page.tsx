'use client';

import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { useAuth } from '@/hooks/use-auth';
import { useReports } from '@/hooks/itsection/use-reports';
import { useDigitization } from '@/hooks/itsection/use-digitization'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  History, UserCircle, Layers, BookOpen, FilePlus, ArrowRight, 
  Clock, CheckCircle2, AlertCircle, Mail, Phone, MapPin, 
  Fingerprint, Calendar, Lock, KeyRound
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { reports: allReports = [] } = useReports(user);
  
  // refreshData mangwao taake realtime update ho sakay
  const { records: allRecords = [], loading: tasksLoading, refreshData } = useDigitization(); 
  
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // --- REALTIME SYNC FOR DASHBOARD ---
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digitization_records' }, 
      () => { if (refreshData) refreshData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  // Statistics Calculation
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const userReports = allReports.filter(r => r.employee_id === user?.id);
    const todayReports = userReports.filter(r => r.submitted_date === today);
    
    // SIRF USER KE APNE TASKS FILTER KAREIN
    const myTasks = Array.isArray(allRecords) 
      ? allRecords.filter(t => t.assignee === user?.name) 
      : [];

    const pendingTasks = myTasks.filter(t => t.stage !== 'Completed');

    return {
      todayPages: todayReports.filter(r => r.type === 'Pages').reduce((s, r) => s + r.quantity, 0),
      todayBooks: todayReports.filter(r => r.type === 'Books').reduce((s, r) => s + r.quantity, 0),
      pendingTasksCount: pendingTasks.length,
      activeTask: pendingTasks[0] || null, // Pehla pending task as active assignment
      recent: userReports.slice(0, 6),
      myTasks // Pass this for mapping in UI
    };
  }, [allReports, allRecords, user, today]);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Updated!", description: "Password changed successfully." });
      setNewPassword(''); setConfirmPassword('');
    }
    setUpdating(false);
  };

  if (!user) return <div className="h-screen flex items-center justify-center font-black text-primary uppercase animate-pulse">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <UserCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">{user.name}</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">{user.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/itsection/global-library">
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2 hover:bg-slate-50 transition-all">
              Global Library
            </Button>
          </Link>
          <Link href="/dashboard/employee-reports">
            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-indigo-100 group bg-indigo-600 hover:bg-indigo-700">
              <FilePlus className="mr-2 h-5 w-5" /> New Report <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-all" />
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-200/50 backdrop-blur-md p-1 rounded-2xl inline-flex w-auto mb-8 border border-slate-200">
          <TabsTrigger value="overview" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Security & Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
          
          {/* --- TOP STATS --- */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 flex items-center justify-between relative">
                <Layers className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-white/10" />
                <div className="space-y-1 z-10">
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Today's Pages</p>
                  <h3 className="text-5xl font-black tracking-tighter">{stats.todayPages.toLocaleString()}</h3>
                </div>
                <div className="h-14 w-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center z-10"><Layers className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 flex items-center justify-between relative">
                <BookOpen className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-white/10" />
                <div className="space-y-1 z-10">
                  <p className="text-violet-100 text-[10px] font-black uppercase tracking-widest">Today's Books</p>
                  <h3 className="text-5xl font-black tracking-tighter">{stats.todayBooks.toLocaleString()}</h3>
                </div>
                <div className="h-14 w-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center z-10"><BookOpen className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border border-orange-100">
              <CardContent className="p-8 flex items-center justify-between relative">
                <Clock className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-orange-500/5" />
                <div className="space-y-1 z-10">
                  <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Pending Tasks</p>
                  <h3 className="text-5xl font-black tracking-tighter text-slate-800">{stats.pendingTasksCount}</h3>
                </div>
                <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 z-10">
                  <Clock className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Recent Submissions */}
            <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white border border-slate-100">
              <CardHeader className="px-8 pt-8 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.recent.map((report) => (
                    <div key={report.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all">
                      <div className="flex justify-between mb-2">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase">{report.type}</Badge>
                        <span className="text-[10px] font-black text-slate-400">{report.submitted_date}</span>
                      </div>
                      <p className="text-2xl font-black text-slate-800">{report.quantity.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 truncate">{report.stage}</p>
                    </div>
                  ))}
                  {stats.recent.length === 0 && <p className="text-slate-400 italic text-sm py-4">No recent reports found.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Current Active Task Card */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
              <CardHeader className="px-8 pt-8 relative z-10">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-400" /> Active Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 relative z-10">
                {stats.activeTask ? (
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-bold text-xl leading-snug break-words">{stats.activeTask.book_name}</h4>
                      <p className="text-slate-400 text-[10px] font-mono mt-2 break-all opacity-70">{stats.activeTask.file_name}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase text-[9px] px-2 py-1">
                          {stats.activeTask.stage}
                        </Badge>
                        {stats.activeTask.deadline && (
                           <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                             Due: {stats.activeTask.deadline}
                           </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-5 border-t border-white/10">
                      <Link href="/dashboard/itsection/global-library">
                        <Button className="w-full bg-white text-slate-900 hover:bg-indigo-50 font-black rounded-xl border-none h-11 transition-all active:scale-95">
                          OPEN TASK HUB
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 italic text-sm uppercase font-bold tracking-widest">All caught up!</p>
                  </div>
                )}
              </CardContent>
              {/* Abstract decorative shape */}
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
            </Card>
          </div>
        </TabsContent>

        {/* --- SECURITY & PROFILE TAB --- */}
        <TabsContent value="profile" className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] shadow-xl border-none p-8 space-y-6 bg-white">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Lock className="text-indigo-600" /> Update Password
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1">New Password</p>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl h-12 border-2 focus:ring-indigo-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirm New Password</p>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="rounded-xl h-12 border-2 focus:ring-indigo-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={updating || !newPassword}
                  className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {updating ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[2rem] shadow-xl border-none p-8 bg-white">
              <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Fingerprint className="text-indigo-600" /> Personal Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Mail className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Registered Email</p>
                    <p className="font-bold text-slate-700">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <KeyRound className="text-indigo-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">System Identity (ID)</p>
                    <p className="font-bold text-slate-700 font-mono text-xs">{user.id}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}