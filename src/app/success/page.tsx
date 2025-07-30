
'use client';

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);

    useEffect(() => {
        setOrderId(searchParams.get('orderId'));
        setPaymentId(searchParams.get('paymentId'));
    }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader className="p-6">
          <CheckCircle2 className="mx-auto h-16 w-16" style={{ color: 'hsl(var(--accent))' }}/>
          <CardTitle className="text-2xl font-bold mt-4">
            Payment Successful!
          </CardTitle>
           <CardDescription>
            Your registration has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {orderId && paymentId && (
            <div className="text-sm text-muted-foreground mb-6 space-y-1 bg-muted p-4 rounded-md">
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Payment ID:</strong> {paymentId}</p>
            </div>
          )}
           <Button asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
