'use client';

import { Suspense } from 'react';
import SuccessContent from './SuccessContent';

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 animate-fade-in">
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading payment details...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}