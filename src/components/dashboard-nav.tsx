
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
  Calendar,
  Send,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/user-management', icon: Users, label: 'User Management' },
];

const itScanningItems = [
    { href: '/dashboard/scanning', icon: ScanLine, label: 'Digitization Progress' },
    { href: '/dashboard/employee-reports', icon: FileSignature, label: 'Digitization Report' },
    { href: '/dashboard/attendance', icon: CalendarCheck, label: 'Attendance' },
    { href: '/dashboard/employee-task-record', icon: ClipboardCheck, label: 'Employee Task Record' },
];

const administrationItems = [
    { href: '/dashboard/salaries', icon: DollarSign, label: 'Salaries' },
    { href: '/dashboard/petty-cash', icon: Wallet, label: 'Petty Cash' },
    { href: '/dashboard/correspondence', icon: FileText, label: 'Correspondence with Government Officials' },
];

const appFileItems = [
    { href: '/dashboard/report-assistant', icon: Sparkles, label: 'Report Assistant' },
    { href: '/dashboard/reporting', icon: FileText, label: 'Reporting' },
];

const publicationItems = [
  { href: '/dashboard/library', icon: Library, label: 'Auto-Generate-Bill' },
  { href: '/dashboard/publications', icon: BookOpen, label: 'Bills-Records' },
];

const mhpResearchLibraryItems = [
  { href: '/dashboard/lib-attendance', icon: CalendarCheck, label: 'Lib-Attendance' },
  { href: '/dashboard/lib-emp-report', icon: FileSignature, label: 'Lib-Emp-Report' },
  { href: '/dashboard/mhpr-lib-database', icon: Database, label: 'MHPR-Lib-Data base' },
];

const eventsProgramItems = [
  { href: '/dashboard/auto-invitation', icon: Send, label: 'Auto Invitation' },
];

const otherNavItems = [
  { href: '/dashboard/projects', icon: Briefcase, label: 'Projects' },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [isItSectionOpen, setIsItSectionOpen] = useState(
    pathname.startsWith('/dashboard/scanning') || pathname.startsWith('/dashboard/employee-reports') || pathname.startsWith('/dashboard/attendance') || pathname.startsWith('/dashboard/employee-task-record')
  );
  
  const [isAdministrationSectionOpen, setIsAdministrationSectionOpen] = useState(
    pathname.startsWith('/dashboard/salaries') || pathname.startsWith('/dashboard/petty-cash') || pathname.startsWith('/dashboard/correspondence')
  );
  
  const [isMhpResearchLibrarySectionOpen, setIsMhpResearchLibrarySectionOpen] = useState(
    pathname.startsWith('/dashboard/lib-attendance') || pathname.startsWith('/dashboard/lib-emp-report') || pathname.startsWith('/dashboard/mhpr-lib-database')
  );

  const [isPublicationSectionOpen, setIsPublicationSectionOpen] = useState(
    pathname.startsWith('/dashboard/publications') || pathname.startsWith('/dashboard/library')
  );
  
  const [isAppFileSectionOpen, setIsAppFileSectionOpen] = useState(
    pathname.startsWith('/dashboard/report-assistant') || pathname.startsWith('/dashboard/reporting')
  );
  const [isEventsProgramSectionOpen, setIsEventsProgramSectionOpen] = useState(
    pathname.startsWith('/dashboard/auto-invitation')
  );
  
  if (user?.role === 'I.T & Scanning-Employee') {
    const itScanningEmployeeNavItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ...itScanningItems,
    ];

    return (
       <SidebarContent className="p-2">
          <SidebarMenu className="flex flex-col gap-y-4">
              {itScanningEmployeeNavItems.map((item, index) => (
              <SidebarMenuItem key={`${item.href}-${index}`}>
                  <Link href={item.href}>
                  <SidebarMenuButton
                      isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                      tooltip={item.label}
                      className="justify-start"
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              ))}
          </SidebarMenu>
      </SidebarContent>
    );
  }

  if (user?.role === 'Library-Employee') {
    const libraryEmployeeNavItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ...mhpResearchLibraryItems,
    ];

    return (
      <SidebarContent className="p-2">
        <SidebarMenu className="flex flex-col gap-y-4">
            {libraryEmployeeNavItems.map((item, index) => (
                <SidebarMenuItem key={`${item.href}-${index}`}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                    tooltip={item.label}
                    className="justify-start"
                    >
                    <item.icon />
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
    );
  }

  if (user?.role === 'Accounts') {
    return (
      <SidebarContent className="p-2">
        <SidebarMenu className="flex flex-col gap-y-4">
           <SidebarMenuItem>
              <Link href="/dashboard">
              <SidebarMenuButton
                  isActive={pathname === '/dashboard'}
                  tooltip="Dashboard"
                  className="justify-start"
              >
                  <LayoutDashboard />
                  <span>Dashboard</span>
              </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <Collapsible open={isAdministrationSectionOpen} onOpenChange={setIsAdministrationSectionOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className='w-full justify-between' isActive={isAdministrationSectionOpen}>
                <div className="flex items-center gap-2">
                  <Wallet />
                  <span>Administration-Section</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 transition-transform', isAdministrationSectionOpen && 'rotate-180')} />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-1 pl-6">
              <SidebarMenu className="flex flex-col gap-y-2">
                {administrationItems.map((item, index) => (
                  <SidebarMenuItem key={`${item.href}-${index}`}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                        className="justify-start"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenu>
      </SidebarContent>
    );
  }

  if (user?.role === 'Admin') {
    return (
      <SidebarContent className="p-2">
          <SidebarMenu className="flex flex-col gap-y-4">
              {mainNavItems.map((item, index) => (
                <SidebarMenuItem key={`${item.href}-${index}`}>
                    <Link href={item.href}>
                    <SidebarMenuButton
                        isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                        tooltip={item.label}
                        className="justify-start"
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              ))}

            <Collapsible open={isItSectionOpen} onOpenChange={setIsItSectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isItSectionOpen}>
                        <div className="flex items-center gap-2">
                            <ScanLine />
                            <span>I.T &amp; Scanning-Section</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isItSectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {itScanningItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>
            
            <Collapsible open={isAdministrationSectionOpen} onOpenChange={setIsAdministrationSectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isAdministrationSectionOpen}>
                        <div className="flex items-center gap-2">
                            <Wallet />
                            <span>Administration-Section</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isAdministrationSectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {administrationItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isMhpResearchLibrarySectionOpen} onOpenChange={setIsMhpResearchLibrarySectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isMhpResearchLibrarySectionOpen}>
                        <div className="flex items-center gap-2">
                             <Library />
                             <span>MHP-Research Library</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isMhpResearchLibrarySectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {mhpResearchLibraryItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>
            
            <Collapsible open={isPublicationSectionOpen} onOpenChange={setIsPublicationSectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isPublicationSectionOpen}>
                        <div className="flex items-center gap-2">
                            <BookOpen />
                            <span>Publication section</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isPublicationSectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {publicationItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isEventsProgramSectionOpen} onOpenChange={setIsEventsProgramSectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isEventsProgramSectionOpen}>
                        <div className="flex items-center gap-2">
                            <Calendar />
                            <span>Event's & Program's</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isEventsProgramSectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {eventsProgramItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>

            {otherNavItems.map((item, index) => (
                <SidebarMenuItem key={`${item.href}-${index}`}>
                    <Link href={item.href}>
                    <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                        className="justify-start"
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}

            <Collapsible open={isAppFileSectionOpen} onOpenChange={setIsAppFileSectionOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='w-full justify-between' isActive={isAppFileSectionOpen}>
                        <div className="flex items-center gap-2">
                            <File />
                            <span>App File</span>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isAppFileSectionOpen && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                     <SidebarMenu className="flex flex-col gap-y-2">
                        {appFileItems.map((item, index) => (
                            <SidebarMenuItem key={`${item.href}-${index}`}>
                                <Link href={item.href}>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                    className="justify-start"
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
      </SidebarContent>
    )
  }

  // Fallback for other roles or if user is null
  return (
    <SidebarContent className="p-2">
        <SidebarMenu className="flex flex-col gap-y-2">
             <SidebarMenuItem>
                <Link href="/dashboard">
                <SidebarMenuButton
                    isActive={pathname === '/dashboard'}
                    tooltip="Dashboard"
                    className="justify-start"
                >
                    <LayoutDashboard />
                    <span>Dashboard</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
    </SidebarContent>
  );
}
