'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    // Role aur Department ab auto-set hain
    role: 'I.T & Scanning-Employee',
    department: 'I.T Section' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
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
      // Signup function call
      await signup(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.role as any
      );
      
      toast({
        title: 'Registration Sent!',
        description: 'Account created. Please wait for Admin approval.',
      });
      
      // Success ke baad login par bhej dena
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
    <div className="flex min-h-screen items-center justify-center bg-black p-4 font-sans">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-900 p-8 border border-zinc-800 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="text-indigo-500 h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Join MHPISSJ</h2>
          <p className="text-zinc-400 text-sm">Registering for <span className="text-indigo-400 font-semibold">I.T Section</span></p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded-xl bg-zinc-800/50 pl-10 pr-4 py-3 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full rounded-xl bg-zinc-800/50 pl-10 pr-4 py-3 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl bg-zinc-800/50 pl-10 pr-4 py-3 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Hidden/Disabled Role Info (Sirf dikhane ke liye) */}
          <div className="p-3 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
             <p className="text-[11px] text-indigo-300 uppercase tracking-widest font-bold text-center">
               Access Level: Employee (I.T)
             </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <button 
            onClick={() => router.push('/login')} 
            className="text-indigo-400 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}