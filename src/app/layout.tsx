import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-provider';

export const metadata: Metadata = {
  title: 'MHPISSJ-Portal',
  description: 'M.H. Panhwar Institute App',
  icons: {
    icon: '/logo.png', // Browser tab mein logo dikhane ke liye
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 'dark' class agar zaroori nahi toh hata dein ya 'light' rakhein taaki flickering na ho
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Poppins font ko priority ke saath load karein */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/mb-lateefi" rel="stylesheet" />
      </head>
      {/* font-body ko globals.css mein Poppins par map kar dein */}
      <body className="antialiased min-h-screen bg-background selection:bg-indigo-100">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}