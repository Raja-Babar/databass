'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User as UserIcon, Shield, Upload, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function UserNav() {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  if (!user) return null;

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'Admin': return { variant: 'destructive', color: 'ring-red-500' };
      case 'I.T & Scanning-Employee': return { variant: 'secondary', color: 'ring-indigo-600' };
      case 'Library-Employee': return { variant: 'default', color: 'ring-emerald-500' };
      default: return { variant: 'outline', color: 'ring-slate-300' };
    }
  };

  const theme = getRoleTheme(user.role);

  // ... (handleImageUpload and handleProfileUpdate logic remain the same)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 px-2 flex items-center gap-3 hover:bg-slate-100 rounded-2xl transition-all">
             <div className="hidden md:flex flex-col items-end">
               <p className="text-sm font-black leading-tight text-slate-800 uppercase tracking-tighter">{user.name}</p>
               <p className="text-[10px] font-bold leading-tight text-muted-foreground uppercase italic tracking-widest">
                {user.role}
              </p>
             </div>
            <div className={cn("rounded-full p-0.5 ring-2 ring-offset-2", theme.color)}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                <AvatarFallback className="font-bold">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col space-y-1">
                  <p className="text-base font-black text-slate-800 leading-none uppercase">{user.name}</p>
                  <p className="text-xs font-medium leading-none text-muted-foreground italic">
                  {user.email}
                  </p>
              </div>
              <Badge variant={theme.variant as any} className="w-fit text-[10px] px-2 py-0.5 font-black uppercase">
                <Shield className="h-3 w-3 mr-1" /> {user.role}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100" />
          
          <DropdownMenuGroup className="p-1">
            <DropdownMenuItem onSelect={() => setIsProfileDialogOpen(true)} className="rounded-xl cursor-pointer py-2 px-3">
              <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
              <span className="font-bold text-slate-700">Quick Edit Profile</span>
            </DropdownMenuItem>
            
            <Link href="/dashboard/itsection/profile">
              <DropdownMenuItem className="rounded-xl cursor-pointer py-2 px-3">
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span className="font-bold text-slate-700">Account Settings</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="bg-slate-100" />
          
          <DropdownMenuItem onClick={logout} className="rounded-xl cursor-pointer py-2 px-3 text-red-600 focus:bg-red-50 focus:text-red-700">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="font-black uppercase text-xs">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- Keep Dialog code as it is for Name/Avatar editing --- */}
    </>
  );
}