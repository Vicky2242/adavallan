
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { Home, LogIn } from 'lucide-react';

const SharedHeader: React.FC = () => {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
              <Image src="/admin-logo.png" alt="Company Logo" width={180} height={51} className="object-contain" />
            </Link>
            <div className="flex-1" />
            <Button asChild variant="outline">
                <Link href="/ssc/home">
                    <Home className="mr-2 h-4 w-4" /> Go to Main Site
                </Link>
            </Button>
            <Button asChild>
                <Link href="/admin/login">
                    <LogIn className="mr-2 h-4 w-4" /> Admin Login
                </Link>
            </Button>
        </header>
    );
}

export default SharedHeader;
