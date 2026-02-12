'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'I.T & Scanning-Employee',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup, appLogo } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({ 
        variant: 'destructive', 
        title: 'Missing Info', 
        description: 'Please fill all fields to continue.' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.role as any
      );
      
      toast({
        title: 'Registration Successful',
        description: 'Account created! Please wait for Admin approval.',
      });
      
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'Network error, please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[2.5rem] bg-white">
          <div className="bg-indigo-600 h-2 w-full" />
          
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto bg-slate-50 p-3 rounded-full shadow-inner inline-block mb-4 relative">
              <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center bg-white border shadow-sm">
                <Image 
                  src={appLogo || "/logo.png"} 
                  alt="MHPISSJ Logo" 
                  width={100} 
                  height={100} 
                  className="object-cover"
                  priority
                  unoptimized 
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter text-slate-800 uppercase leading-none">
              JOIN MHPISSJ
            </CardTitle>
            <CardDescription className="text-indigo-600 font-bold italic mt-2">
              Create your employee account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 ml-1 text-sm">Full Name</label>
                <Input 
                  placeholder="John Doe" 
                  className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-950 font-bold transition-all shadow-sm" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 ml-1 text-sm">Email Address</label>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-950 font-bold transition-all shadow-sm" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="font-bold text-slate-600 ml-1 text-sm">Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-950 font-bold transition-all shadow-sm" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Access Info Tag */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                 <p className="text-[10px] text-indigo-600 uppercase tracking-widest font-black text-center">
                   Default Access: I.T & Scanning Employee
                 </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl font-black text-sm tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </Button>

              <div className="text-center space-y-4 mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  Already have an account?{' '}
                  <Link href="/login" className="font-black text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline">
                    SIGN IN
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          M.H. Panhwar Institute © 2026
        </p>
      </div>
    </main>
  );
}