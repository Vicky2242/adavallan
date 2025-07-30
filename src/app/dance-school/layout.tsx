
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SSCHeader from '@/components/ssc-header';
import SharedFooter from '@/components/shared-footer';
import DanceSchoolLayoutSelector from './layout-selector';

// This is now a pure Server Component.
export default function DanceSchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
        <SSCHeader />
      </Suspense>
      <main className="flex-grow">
        {/* The client-side logic is now encapsulated in this component */}
        <DanceSchoolLayoutSelector>{children}</DanceSchoolLayoutSelector>
      </main>
       <Suspense fallback={<div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
        <SharedFooter />
      </Suspense>
    </div>
  );
}
