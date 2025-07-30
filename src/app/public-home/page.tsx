
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and now redirects to the new /ssc landing page.
// The content has been moved to /ssc/page.tsx and related components.
export default function PublicHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ssc');
  }, [router]);

  return null;
}
