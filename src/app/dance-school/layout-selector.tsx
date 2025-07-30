
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';

interface DanceSchoolSessionData {
  schoolId: string;
  schoolName: string;
  email: string;
}

const navItems = [
  { href: '/dance-school/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dance-school/group-registration', icon: Users, label: 'Group Registration' },
  { href: '/dance-school/profile', icon: Settings, label: 'Manage Profile' },
];

function NavContent() {
  const pathname = usePathname();

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        pathname === href && 'bg-muted text-primary'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => <NavLink key={item.href} {...item} />)}
    </nav>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<DanceSchoolSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionDataString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    if (sessionDataString) {
      try {
        const parsedSession: DanceSchoolSessionData = JSON.parse(sessionDataString);
        setSession(parsedSession);
      } catch (e) {
        console.error("Failed to parse dance school session", e);
        toast({ title: "Session Error", description: "Invalid session data. Please log in again.", variant: "destructive" });
        router.replace('/dance-school/login');
      }
    } else {
       toast({ title: "Unauthorized", description: "Please log in to access the dashboard.", variant: "destructive" });
       router.replace('/dance-school/login');
    }
    setIsLoading(false);
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/dance-school/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'DS';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  if (isLoading || !session) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="grid min-h-[calc(100vh-145px)] w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/20 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/dance-school/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
              <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(session.schoolName)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">{session.schoolName}</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <NavContent />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <SheetHeader className="sr-only">
                 <SheetTitle>Dance School Menu</SheetTitle>
                 <SheetDescription>Main navigation menu for the dance school panel.</SheetDescription>
               </SheetHeader>
               <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/dance-school/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
                   <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(session.schoolName)}</AvatarFallback>
                   </Avatar>
                  <span className="ml-2">{session.schoolName}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <h1 className="font-semibold text-lg uppercase tracking-wider text-foreground/80">{session.schoolName}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto p-1 pr-2 space-x-2 rounded-full">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium">{session.email}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dance-school/profile"><Settings className="mr-2 h-4 w-4" />Manage Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DanceSchoolLayoutSelector({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const publicPages = [
    '/dance-school/login',
    '/dance-school/register',
    '/dance-school/registration-success',
    '/dance-school/group-registration',
    '/dance-school/group-payment',
    '/dance-school/payment-success'
  ];

  const isPublicPage = publicPages.includes(pathname);

  if (isPublicPage) {
     return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
