
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SSCHeader from '@/components/ssc-header';
import SharedFooter from '@/components/shared-footer';

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
         <SSCHeader />
        </Suspense>
        <main className="flex-grow">{children}</main>
        <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
          <SharedFooter />
        </Suspense>
      </div>
  );
}
