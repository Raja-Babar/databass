'use client';

import { useState, useMemo } from 'react';
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
  
  // Destructuring with alias 'myTasks' to fix the filter error
  const { records: myTasks = [], loading: tasksLoading } = useDigitization(); 
  
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Statistics Calculation
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const userReports = allReports.filter(r => r.employee_id === user?.id);
    const todayReports = userReports.filter(r => r.submitted_date === today);
    
    // Safety check for myTasks to prevent .filter error
    const tasksArray = Array.isArray(myTasks) ? myTasks : [];
    const pendingTasks = tasksArray.filter(t => t.stage !== 'Completed');

    return {
      todayPages: todayReports.filter(r => r.type === 'Pages').reduce((s, r) => s + r.quantity, 0),
      todayBooks: todayReports.filter(r => r.type === 'Books').reduce((s, r) => s + r.quantity, 0),
      pendingTasksCount: pendingTasks.length,
      recent: userReports.slice(0, 6)
    };
  }, [allReports, myTasks, user, today]);

  const handlePasswordChange = async () => {
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
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2">
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
                <div className="space-y-1">
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Today's Pages</p>
                  <h3 className="text-5xl font-black tracking-tighter">{stats.todayPages.toLocaleString()}</h3>
                </div>
                <div className="h-14 w-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center"><Layers className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 flex items-center justify-between relative">
                <BookOpen className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-white/10" />
                <div className="space-y-1">
                  <p className="text-violet-100 text-[10px] font-black uppercase tracking-widest">Today's Books</p>
                  <h3 className="text-5xl font-black tracking-tighter">{stats.todayBooks.toLocaleString()}</h3>
                </div>
                <div className="h-14 w-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center"><BookOpen className="h-6 w-6" /></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border border-orange-100">
              <CardContent className="p-8 flex items-center justify-between relative">
                <Clock className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-orange-500/5" />
                <div className="space-y-1">
                  <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Pending Tasks</p>
                  <h3 className="text-5xl font-black tracking-tighter text-slate-800">{stats.pendingTasksCount}</h3>
                </div>
                <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
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
                    <div key={report.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex justify-between mb-2">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase">{report.type}</Badge>
                        <span className="text-[10px] font-black text-slate-400">{report.submitted_date}</span>
                      </div>
                      <p className="text-2xl font-black text-slate-800">{report.quantity.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 truncate">{report.stage}</p>
                    </div>
                  ))}
                  {stats.recent.length === 0 && <p className="text-slate-400 italic text-sm">No recent reports found.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Current Active Task Card */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-indigo-400" /> Active Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {myTasks.filter(t => t.stage !== 'Completed').slice(0, 1).map(task => (
                  <div key={task.id} className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xl leading-tight">{task.file_name}</h4>
                      <p className="text-slate-400 text-xs mt-1 italic">Book: {task.book_name || 'N/A'}</p>
                      <Badge className="mt-2 bg-indigo-500/20 text-indigo-300 border-none uppercase text-[9px]">{task.stage}</Badge>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <Link href="/dashboard/itsection/global-library">
                        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-black rounded-xl border-none">
                          VIEW TASK HUB
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {myTasks.filter(t => t.stage !== 'Completed').length === 0 && (
                  <p className="text-slate-400 italic text-sm">No active tasks assigned to you right now.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- SECURITY & PROFILE TAB --- */}
        <TabsContent value="profile" className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[2rem] shadow-xl border-none p-8 space-y-6">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Lock className="text-indigo-600" /> Update Password
              </h3>
              <div className="space-y-4">
                <Input 
                  type="password" 
                  placeholder="New Password" 
                  className="rounded-xl h-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Confirm Password" 
                  className="rounded-xl h-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={updating}
                  className="w-full h-12 rounded-xl font-bold bg-indigo-600"
                >
                  {updating ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[2rem] shadow-xl border-none p-8">
              <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Fingerprint className="text-indigo-600" /> Personal Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <Mail className="text-slate-400 h-5 w-5" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Email Address</p>
                    <p className="font-bold text-slate-700">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <KeyRound className="text-slate-400 h-5 w-5" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Employee ID</p>
                    <p className="font-bold text-slate-700 font-mono">{user.id.slice(0, 8)}...</p>
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