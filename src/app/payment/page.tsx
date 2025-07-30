'use client';

import { Suspense } from 'react';
import PaymentContent from './PaymentContent';

export default function PaymentPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start bg-background py-8 px-4">
      <Suspense fallback={<div className="text-muted-foreground text-center mt-12">Loading payment page...</div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}