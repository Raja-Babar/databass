'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Naya Client
import { createBrowserClient } from '@supabase/ssr';

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
  const { appLogo } = useAuth(); // Purana hook sirf logo ke liye
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Supabase Client initialize
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      // 1. Supabase Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Database Fetch (Isme error handle kiya hai)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('status')
          .eq('id', authData.user.id)
          .maybeSingle();

        // 3. Status Check Logic
        // Agar record mil gaya aur status 'approved' nahi hai, sirf tab hi roko
        if (userData && userData.status && userData.status.toLowerCase() !== 'approved') {
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'Your account is pending approval from Admin.',
          });
          setIsLoading(false);
          return;
        }

        // 4. Sab sahi hai, toh Dashboard bhejo (Puranay style mein)
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        
        // Puranay code wala router.push bhi chal jayega ab
        router.push('/dashboard');
        
        // Agar router.push kaam na kare, toh niche wala line uncomment kar dena:
        // window.location.assign('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl overflow-hidden border-t-4 border-primary">
          <CardHeader className="text-center pt-8">
            <div className="mx-auto">
              <Image src={appLogo} alt="Logo" width={112} height={112} className="h-28 w-28 rounded-full" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight mt-4">MHPISSJ-Portal</CardTitle>
            <CardDescription className="text-primary">M.H. Panhwar Institute App</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Sign In'}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}