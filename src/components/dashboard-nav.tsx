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
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  DollarSign,
  Briefcase,
  BookOpen,
  ScanLine,
  Sparkles,
  Users,
  FileText,
  FileSignature,
  ChevronDown,
  File,
  Library,
  Database,
  ClipboardCheck,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// --- 1. I.T SECTION PATHS (Updated folder: itsection) ---
const itScanningItems = [
  { href: '/dashboard/scanning', icon: ScanLine, label: 'Digitization Progress' },
  { href: '/dashboard/itsection/employee-reports', icon: FileSignature, label: 'Digitization Report' },
  { href: '/dashboard/itsection/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/dashboard/itsection/employee-task-record', icon: ClipboardCheck, label: 'Employee Task Record' },
];

const appFileItems = [
  { href: '/dashboard/report-assistant', icon: Sparkles, label: 'Report Assistant' },
  { href: '/dashboard/itsection/reporting', icon: FileText, label: 'Reporting' },
];

// --- 2. LIBRARY SECTION PATHS (mhprl folder) ---
const mhpResearchLibraryItems = [
  { href: '/dashboard/mhprl/lib-attendance', icon: CalendarCheck, label: 'Lib-Attendance' },
  { href: '/dashboard/mhprl/lib-emp-report', icon: FileSignature, label: 'Lib-Emp-Report' },
  { href: '/dashboard/mhprl/mhpr-lib-database', icon: Database, label: 'MHPR-Lib-Database' },
];

const publicationItems = [
  { href: '/dashboard/mhprl/library', icon: Library, label: 'Auto-Generate-Bill' },
  { href: '/dashboard/publications', icon: BookOpen, label: 'Bills-Records' },
];

// --- 3. ADMINISTRATION PATHS ---
const administrationItems = [
  { href: '/dashboard/salaries', icon: DollarSign, label: 'Salaries' },
  { href: '/dashboard/petty-cash', icon: Wallet, label: 'Petty Cash' },
  { href: '/dashboard/correspondence', icon: FileText, label: 'Correspondence' },
];

// --- Sub-component for Collapsible Sections ---
function NavSection({ 
  title, icon: Icon, items, isOpen, onOpenChange, pathname 
}: { 
  title: string, icon: any, items: any[], isOpen: boolean, onOpenChange: (v: boolean) => void, pathname: string 
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className='w-full justify-between' isActive={isOpen}>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="py-1 pl-4 border-l ml-4 mt-1 border-slate-200">
        <SidebarMenu className="flex flex-col gap-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} className="w-full">
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className={cn(
                    "text-xs h-8 w-full",
                    pathname === item.href ? "text-indigo-600 font-bold" : "text-slate-500"
                  )}
                >
                  <item.icon className="h-3 w-3" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [openSections, setOpenSections] = useState({
    it: pathname.includes('/itsection') || pathname.includes('/scanning'),
    admin: pathname.includes('salaries') || pathname.includes('petty-cash'),
    lib: pathname.includes('mhprl'),
    pub: pathname.includes('publications') || pathname.includes('mhprl/library'),
    app: pathname.includes('report-') || pathname.includes('itsection/reporting'),
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!user) return null;

  return (
    <SidebarContent className="p-3">
      <SidebarMenu className="flex flex-col gap-y-2">
        
        {/* --- COMMON: DASHBOARD --- */}
        <SidebarMenuItem>
          <Link href="/dashboard">
            <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Dashboard">
              <LayoutDashboard className={pathname === '/dashboard' ? "text-indigo-600" : ""} />
              <span className={cn("font-bold", pathname === '/dashboard' && "text-indigo-600")}>Dashboard</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        {/* --- ROLE: ADMIN --- */}
        {user.role === 'Admin' && (
          <>
            <SidebarMenuItem>
              <Link href="/dashboard/user-management">
                <SidebarMenuButton isActive={pathname.startsWith('/dashboard/user-management')}>
                  <Users />
                  <span className="font-medium">User Management</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <NavSection title="I.T & Scanning" icon={ScanLine} items={itScanningItems} isOpen={openSections.it} onOpenChange={() => toggleSection('it')} pathname={pathname} />
            <NavSection title="Administration" icon={Wallet} items={administrationItems} isOpen={openSections.admin} onOpenChange={() => toggleSection('admin')} pathname={pathname} />
            <NavSection title="MHP-Library" icon={Library} items={mhpResearchLibraryItems} isOpen={openSections.lib} onOpenChange={() => toggleSection('lib')} pathname={pathname} />
            <NavSection title="Publications" icon={BookOpen} items={publicationItems} isOpen={openSections.pub} onOpenChange={() => toggleSection('pub')} pathname={pathname} />
            
            <SidebarMenuItem>
              <Link href="/dashboard/projects">
                <SidebarMenuButton isActive={pathname.startsWith('/dashboard/projects')}>
                  <Briefcase />
                  <span>Projects</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <NavSection title="App File" icon={File} items={appFileItems} isOpen={openSections.app} onOpenChange={() => toggleSection('app')} pathname={pathname} />
          </>
        )}

        {/* --- ROLE: I.T & SCANNING EMPLOYEE --- */}
        {user.role === 'I.T & Scanning-Employee' && (
          itScanningItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href}>
                  <item.icon className={pathname === item.href ? "text-indigo-600" : ""} />
                  <span className={pathname === item.href ? "font-bold text-indigo-600" : ""}>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))
        )}

        {/* --- ROLE: LIBRARY EMPLOYEE --- */}
        {user.role === 'Library-Employee' && (
          mhpResearchLibraryItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href}>
                  <item.icon className={pathname === item.href ? "text-indigo-600" : ""} />
                  <span className={pathname === item.href ? "font-bold text-indigo-600" : ""}>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))
        )}

        {/* --- ROLE: ACCOUNTS --- */}
        {user.role === 'Accounts' && (
          <NavSection title="Administration" icon={Wallet} items={administrationItems} isOpen={openSections.admin} onOpenChange={() => toggleSection('admin')} pathname={pathname} />
        )}

        {/* --- SETTINGS: PROFILE (Fixed link) --- */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2">Settings</p>
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