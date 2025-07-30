
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HeaderContent } from './ssc-header';

interface SSCHeaderClientProps {
  headerContent: HeaderContent | null;
}

const SSCHeaderClient: React.FC<SSCHeaderClientProps> = ({ headerContent }) => {
  if (!headerContent) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-20 max-w-screen-xl items-center justify-between">
          <p>Error loading header.</p>
        </div>
      </header>
    );
  }

  const menuItems = headerContent.menuItems || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-20 max-w-screen-xl items-center">
        <Link href="/ssc/home" className="mr-6 flex items-center space-x-2">
          <Image src="/admin-logo.png" alt="SSC Logo" width={180} height={51} className="object-contain" data-ai-hint="company logo"/>
        </Link>
        
        <nav className="hidden md:flex flex-1 items-center gap-2 text-sm">
          {menuItems.map((item) => (
            <Button key={item.title} asChild variant="ghost" size="sm" className="text-foreground/80">
              <Link href={item.href}>
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="hidden md:flex flex-1 items-center justify-end gap-2">
           <Button asChild>
             <Link href="/ssc/contact">Contact Us</Link>
           </Button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" /> Register
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/register">Individual Register</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dance-school/register">Group Register</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="flex md:hidden flex-1 justify-end">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Main Menu</SheetTitle>
                        <SheetDescription>Site navigation links</SheetDescription>
                    </SheetHeader>
                    <div className="flex h-[80px] items-center border-b px-6">
                       <Link href="/ssc/home" className="flex items-center gap-2 font-semibold text-foreground">
                         <Image src="/admin-logo.png" alt="SSC Logo" width={150} height={42} className="object-contain" data-ai-hint="company logo"/>
                       </Link>
                    </div>
                    <nav className="flex flex-col gap-4 p-4">
                        {menuItems.map((item) => (
                           <SheetClose asChild key={item.title}>
                                <Link
                                    href={item.href}
                                    className="text-lg"
                                >
                                    {item.title}
                                </Link>
                           </SheetClose>
                        ))}
                         <div className="border-t pt-4 space-y-3">
                           <SheetClose asChild>
                             <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                <Link href="/ssc/contact">Contact Us</Link>
                            </Button>
                           </SheetClose>
                           <SheetClose asChild>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/register">
                                    <User className="mr-2 h-4 w-4" /> Individual Register
                                </Link>
                            </Button>
                           </SheetClose>
                           <SheetClose asChild>
                             <Button asChild variant="outline" className="w-full">
                                <Link href="/dance-school/register">
                                    <User className="mr-2 h-4 w-4" /> Group Register
                                </Link>
                            </Button>
                           </SheetClose>
                         </div>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
};

export default SSCHeaderClient;
