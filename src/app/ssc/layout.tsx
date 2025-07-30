import React, { Suspense } from 'react';
import SSCHeader from '@/components/ssc-header';
import SSCFooter from '@/components/ssc-footer';
import { Loader2 } from 'lucide-react';

// Main layout for the public-facing 'ssc' section of the site.
export default function SSClayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
         <SSCHeader />
        </Suspense>
        <main className="flex-grow">{children}</main>
        <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
          <SSCFooter />
        </Suspense>
      </div>
  );
}
