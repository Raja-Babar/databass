'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useReports } from '@/hooks/itsection/use-reports';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  History, Lock, Mail, User, FilePlus, ArrowRight, LayoutDashboard, 
  KeyRound, UserCircle, Layers, BookOpen, Phone, MapPin, 
  CreditCard, Calendar, Contact2, Fingerprint 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { reports: allReports } = useReports(user);
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Statistics Calculation
  const today = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => {
    const userReports = allReports.filter(r => r.employee_id === user?.id);
    const todayReports = userReports.filter(r => r.submitted_date === today);
    return {
      todayPages: todayReports.filter(r => r.type === 'Pages').reduce((s, r) => s + r.quantity, 0),
      todayBooks: todayReports.filter(r => r.type === 'Books').reduce((s, r) => s + r.quantity, 0),
      recent: userReports.slice(0, 6)
    };
  }, [allReports, user, today]);

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

  if (!user) return <div className="h-screen flex items-center justify-center font-black text-primary uppercase">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
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
        <Link href="/dashboard/employee-reports">
          <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-indigo-100 group">
            <FilePlus className="mr-2 h-5 w-5" /> New Report <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-all" />
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-200/50 backdrop-blur-md p-1 rounded-2xl inline-flex w-auto mb-8">
          <TabsTrigger value="overview" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Full Profile</TabsTrigger>
        </TabsList>

        {/* --- OVERVIEW TAB (Wahi stats jo pehle the) --- */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid gap-6 md:grid-cols-2">
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
          </div>

          {/* Recent Submissions */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" /> Recent Submissions
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
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{report.stage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- FULL PROFILE TAB --- */}
        <TabsContent value="profile" className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* 1. Official Details */}
            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] p-8 bg-white">
               <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 border-b pb-4">
                  <Contact2 className="h-5 w-5 text-indigo-600" /> Official Employee Information
               </h3>
               
               <div className="grid gap-6 sm:grid-cols-2">
                  <ProfileInfoItem label="Full Name" value={user.name} icon={<User className="h-4 w-4" />} />
                  <ProfileInfoItem label="Email ID" value={user.email} icon={<Mail className="h-4 w-4" />} />
                  <ProfileInfoItem label="Designation" value={user.role} icon={<Badge variant="outline" className="h-4 w-4 border-none p-0 capitalize" />} />
                  <ProfileInfoItem label="Joining Date (DOT)" value={user.dot || "Not Set"} icon={<Calendar className="h-4 w-4" />} />
                  <ProfileInfoItem label="NIC Number" value={user.nic || "Not Set"} icon={<Fingerprint className="h-4 w-4" />} />
                  <ProfileInfoItem label="Phone Number" value={user.phone || "Not Set"} icon={<Phone className="h-4 w-4" />} />
                  <ProfileInfoItem label="Emergency Contact" value={user.emergency || "Not Set"} icon={<Contact2 className="h-4 w-4" />} />
                  <ProfileInfoItem label="Bank Account" value={user.bank_details || "Not Set"} icon={<CreditCard className="h-4 w-4" />} />
                  
                  <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Current Address
                    </p>
                    <p className="font-bold text-slate-700">{user.address || "No address provided yet."}</p>
                  </div>
               </div>
            </Card>

            {/* 2. Security / Change Password */}
            <div className="space-y-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-white overflow-hidden">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                    <KeyRound className="h-5 w-5 text-indigo-600" /> Security
                  </h3>
                  <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">New Password</label>
                        <Input type="password" placeholder="••••••••" className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirm Password</label>
                        <Input type="password" placeholder="••••••••" className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      </div>
                      <Button className="w-full h-12 rounded-xl font-black bg-indigo-600" onClick={handlePasswordChange} disabled={updating}>
                        {updating ? "UPDATING..." : "CHANGE PASSWORD"}
                      </Button>
                  </div>
                </Card>

                {/* Info Note */}
                <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] text-center">
                  <p className="text-[11px] font-bold text-indigo-700 italic">
                    Note: If any information is incorrect, please contact the Admin department.
                  </p>
                </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Component for Profile Items
function ProfileInfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-bold text-slate-700 truncate">{value}</p>
    </div>
  );
}