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
  const { login } = useAuth();
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
      await login(values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back to the portal!',
      });
      // Redirect to main dashboard (it handles role-based sub-routing)
      router.replace('/dashboard');
    } catch (error: any) {
      const errorMessage = error?.message || 'Invalid credentials or network error.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[2.5rem] bg-white">
          {/* Top accent bar */}
          <div className="bg-indigo-600 h-2 w-full" />
          
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto bg-slate-50 p-3 rounded-full shadow-inner inline-block mb-4">
              <Image 
                src="/logo.png" 
                alt="MHPISSJ Logo" 
                width={100} 
                height={100} 
                className="h-24 w-24 rounded-full object-cover shadow-sm"
                priority
              />
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
                          className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" 
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
                          className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-2xl font-black text-sm tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? 'AUTHENTICATING...' : 'SIGN IN'}
                </Button>

                <div className="text-center space-y-4 mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-black text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline">
                      SIGN UP
                    </Link>
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-medium text-slate-400">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-600 uppercase">Admin</span>
                      admin@example.com
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-600 uppercase">Employee</span>
                      employee@example.com
                    </div>
                  </div>
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