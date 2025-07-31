import { Suspense } from 'react';
import GroupPaymentPage from './GroupPaymentPage';

export default function GroupPaymentRoute() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading payment form...</div>}>
      <GroupPaymentPage />
    </Suspense>
  );
}

