
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText as SitePagesIcon,
  BarChart2,
  Settings,
  UsersRound,
  Ticket,
  Package as AddonsIcon,
  School,
  Globe,
  PictureInPicture,
  Upload,
  Menu,
  ChevronDown,
  ClipboardList,
  ScanLine,
  Loader2
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import Image from 'next/image';


const LOCAL_STORAGE_ADMIN_LOGGED_IN_KEY = 'adminLoggedIn';
const PROFILE_SETTINGS_KEY = 'adminProfileSettings';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/applicants', icon: Users, label: 'Applicants' },
  { href: '/admin/events', icon: Calendar, label: 'Events' },
  { href: '/admin/scan', icon: ScanLine, label: 'Barcode Scanner' },
  { href: '/admin/site-pages', icon: SitePagesIcon, label: 'Pages' },
];

const manageSubItems = [
  { href: '/admin/manage/countries', icon: Globe, label: 'Countries' },
  { href: '/admin/manage/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/admin/manage/users', icon: UsersRound, label: 'Users' },
  { href: '/admin/manage/addons', icon: AddonsIcon, label: 'Addons' },
  { href: '/admin/manage/dance-schools', icon: School, label: 'Dance Schools' },
  { href: '/admin/manage/group-details', icon: ClipboardList, label: 'Group Details' },
  { href: '/admin/manage/file-upload', icon: Upload, label: 'File Upload' },
  { href: '/admin/manage/slider', icon: PictureInPicture, label: 'Slider' },
];

const otherNavItems = [
  { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

function NavContent() {
  const pathname = usePathname();
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  useEffect(() => {
    setIsManageOpen(pathname.startsWith('/admin/manage'));
  }, [pathname]);

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
    <nav className="grid items-start gap-4 px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => <NavLink key={item.href} {...item} />)}
      
      <Collapsible open={isManageOpen} onOpenChange={setIsManageOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className={cn(
            'flex items-center w-full gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary cursor-pointer',
             pathname.startsWith('/admin/manage') && 'bg-muted text-primary'
          )}>
            <Settings className="h-4 w-4" />
            Manage
            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isManageOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
            <div className="pl-7 mt-1 space-y-1">
                 {manageSubItems.map((item) => <NavLink key={item.href} {...item} />)}
            </div>
        </CollapsibleContent>
      </Collapsible>

      {otherNavItems.map((item) => <NavLink key={item.href} {...item} />)}
    </nav>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loggedIn = localStorage.getItem(LOCAL_STORAGE_ADMIN_LOGGED_IN_KEY);
        if (loggedIn !== 'true') {
            toast({ title: 'Unauthorized', description: 'Please log in to access the admin panel.', variant: 'destructive' });
            router.replace('/admin/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [router, toast]);

    if (!isAuthenticated) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}


export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  

  useEffect(() => {
    const settingsString = localStorage.getItem(PROFILE_SETTINGS_KEY);
    if (settingsString) {
      try {
        const settings = JSON.parse(settingsString);
        if (settings.profileImageDataUri) setProfileImage(settings.profileImageDataUri);
      } catch (e) {
        console.error("Failed to parse profile settings for header image", e);
      }
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_LOGGED_IN_KEY);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/admin/login');
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-white lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
              <Image src="/admin-logo.png" alt="Company Logo" width={180} height={51} className="object-contain" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2 pt-4">
            <NavContent />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <SheetHeader className="sr-only">
                 <SheetTitle>Admin Menu</SheetTitle>
                 <SheetDescription>Main navigation menu for the admin panel.</SheetDescription>
               </SheetHeader>
               <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
                   <Image src="/admin-logo.png" alt="Company Logo" width={180} height={51} className="object-contain" />
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2 pt-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <h1 className="font-semibold text-lg uppercase tracking-wider text-foreground/80">Ulagam Muzhudhum Baratham | Baratha Manadu 2025</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-auto p-1 pr-2 space-x-2 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={profileImage || "https://placehold.co/32x32.png"} alt="Vigneshwaran R" data-ai-hint="user avatar"/>
                    <AvatarFallback>VR</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">Vigneshwaran R</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 md:block text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-muted/40">
           <AuthProvider>
                {children}
            </AuthProvider>
        </main>
        <footer className="text-center text-sm text-muted-foreground p-4 bg-white border-t">
            <a href="https://adavallan.com/index.php" target="_blank" className="hover:text-primary transition-colors">Adavallan Isaiyalayam</a> © {new Date().getFullYear()} All Rights Reserved. Powered by <a href="http://www.wezads.com" target="_blank" className="hover:text-primary transition-colors">WEZADS</a>
        </footer>
      </div>
    </div>
  );
}
