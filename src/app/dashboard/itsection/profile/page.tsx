'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/itsection/use-profile';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, User, Phone, Fingerprint, Calendar, CreditCard, Home, Mail, Building2, Cake } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nic: '',
    dob: '', 
    dot: '', 
    bank_name: '', 
    bank_details: '', 
    emergency: '',
    address: ''
  });

  // Sync database data to form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        nic: user.nic || '',
        dob: user.dob || '',
        dot: user.dot || '',
        bank_name: user.bank_name || '',
        bank_details: user.bank_details || '',
        emergency: user.emergency || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      await updateProfile(user.id, formData);
      
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Update Error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not save data. Check your database columns.",
      });
    }
  };

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">My Profile</h1>
          <p className="text-muted-foreground">Manage your official employment details and personal information.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-sm font-bold bg-indigo-50 text-indigo-700 border-indigo-200 uppercase">
          {user.role}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-slate-200">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 ring-4 ring-indigo-50 shadow-inner">
                <AvatarImage src={user.avatar || `https://avatar.vercel.sh/${user.email}.png`} />
                <AvatarFallback className="text-3xl font-bold bg-indigo-600 text-white">
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>
            <Separator />
            <div className="text-left space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400">Employment Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Active Employee</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Information Form */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Information Form</CardTitle>
            <CardDescription>Fill in your details accurately for payroll and HR purposes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <User className="h-3 w-3" /> Full Name
                  </Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Full Name"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Phone Number
                  </Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="03xx-xxxxxxx"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Row 2: Identity & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" /> NIC Number
                  </Label>
                  <Input 
                    value={formData.nic} 
                    onChange={(e) => setFormData({...formData, nic: e.target.value})}
                    placeholder="42xxx-xxxxxxx-x"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Cake className="h-3 w-3" /> Date of Birth
                  </Label>
                  <Input 
                    type="date"
                    value={formData.dob} 
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Date of Joining
                  </Label>
                  <Input 
                    type="date"
                    value={formData.dot} 
                    onChange={(e) => setFormData({...formData, dot: e.target.value})}
                    className="rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 3: Banking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> Bank Name
                  </Label>
                  <Input 
                    value={formData.bank_name} 
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    placeholder="e.g. Meezan Bank, HBL"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> Account Number / IBAN
                  </Label>
                  <Input 
                    value={formData.bank_details} 
                    onChange={(e) => setFormData({...formData, bank_details: e.target.value})}
                    placeholder="PK00 XXXX XXXX XXXX"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Row 4: Emergency & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Emergency Contact
                  </Label>
                  <Input 
                    value={formData.emergency} 
                    onChange={(e) => setFormData({...formData, emergency: e.target.value})}
                    placeholder="Relative Name - 03xx..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Home className="h-3 w-3" /> Home Address
                  </Label>
                  <Input 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full residential address"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={profileLoading} 
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-12 h-12 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      UPDATING...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      SAVE CHANGES
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}