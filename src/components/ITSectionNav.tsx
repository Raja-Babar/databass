'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  CalendarCheck,
  ScanLine,
  FileSignature,
  ClipboardCheck,
  UserCircle,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sirf IT Section ke items
const itScanningItems = [
  { href: '/dashboard/itsection/global-library', icon: ScanLine, label: 'Digitization Progress' },
  { href: '/dashboard/itsection/employee-reports', icon: FileSignature, label: 'Digitization Report' },
  { href: '/dashboard/itsection/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/dashboard/itsection/my-tasks', icon: ClipboardCheck, label: 'Employee Task Record' },
];

export function ITSectionNav() {
  const pathname = usePathname();

  return (
    <SidebarContent className="p-3">
      <SidebarMenu className="flex flex-col gap-y-2">
        
        {/* --- Dashboard Home --- */}
        <SidebarMenuItem>
          <Link href="/dashboard">
            <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Dashboard">
              <LayoutDashboard className={pathname === '/dashboard' ? "text-indigo-600" : ""} />
              <span className={cn("font-bold", pathname === '/dashboard' && "text-indigo-600")}>Dashboard</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        {/* --- Employee Specific Links --- */}
        <p className="text-[10px] font-black uppercase text-slate-400 px-2 mt-4 mb-1">Work Menu</p>
        {itScanningItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} className="w-full">
              <SidebarMenuButton
                isActive={pathname === item.href}
                className={cn(
                  "transition-all",
                  pathname === item.href ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
                )}
              >
                <item.icon className={cn("h-4 w-4", pathname === item.href && "text-indigo-600")} />
                <span className={cn(pathname === item.href && "font-bold")}>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}

        {/* --- Settings / Profile Section (Jo aap keh rahe thay) --- */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2">My Account</p>
          <SidebarMenuItem>
            <Link href="/dashboard/itsection/profile" className="w-full">
              <SidebarMenuButton 
                isActive={pathname === '/dashboard/itsection/profile'} 
                className={cn(
                  "w-full transition-colors",
                  pathname === '/dashboard/itsection/profile' ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600"
                )}
              >
                <UserCircle className={cn("h-4 w-4", pathname === '/dashboard/itsection/profile' && "text-indigo-600")} />
                <span className="font-bold">Account Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </div>

      </SidebarMenu>
    </SidebarContent>
  );
}