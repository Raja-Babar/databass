'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Direct Supabase Import

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { appLogo } = useAuth(); // Sirf logo context se le rahe hain
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Direct Supabase call to Sign In
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Profile check karein ke approved hai ya nahi
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile?.is_approved) {
          // Agar approved nahi hai toh logout karwa dein
          await supabase.auth.signOut();
          throw new Error('Your account is pending approval from an admin.');
        }

        // 3. Sab theek hai toh redirect
        toast({
          title: 'Login Successful',
          description: 'Welcome back to the portal!',
        });
        
        router.replace('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message || 'Invalid credentials or network error.',
      });
    } finally {
      setIsLoading(false);
    }
  }

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
              MHPISSJ-Portal
            </CardTitle>
            <CardDescription className="text-indigo-600 font-bold italic mt-2">
              Digitization & Research Management
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-600 ml-1">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin@mhp.com" 
                          className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-black transition-all shadow-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-600 ml-1">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-black transition-all shadow-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-2xl font-black text-sm tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    'SIGN IN'
                  )}
                </Button>

                <div className="text-center space-y-4 mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-black text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline">
                      SIGN UP
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          M.H. Panhwar Institute © 2026
        </p>
      </div>
    </main>
  );
}