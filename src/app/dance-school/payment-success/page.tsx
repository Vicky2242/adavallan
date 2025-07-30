import { Suspense } from 'react';
import DanceSchoolPaymentSuccessContent from './DanceSchoolPaymentSuccess';

export default function DanceSchoolPaymentSuccessPage() {
  return (
    <main className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 p-6 animate-fade-in text-foreground">
      <Suspense fallback={<p className="text-muted-foreground text-center">Loading payment details...</p>}>
        <DanceSchoolPaymentSuccessContent />
      </Suspense>
    </main>
  );
}