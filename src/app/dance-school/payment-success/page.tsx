
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, LogIn, Home, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DanceSchoolPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null); // For group payments

  useEffect(() => {
    setOrderId(searchParams.get('orderId'));
    setPaymentId(searchParams.get('paymentId'));
    setGroupId(searchParams.get('groupId'));
  }, [searchParams]);

  return (
    <main className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 p-6 animate-fade-in text-foreground">
      <Card className="w-full max-w-lg text-center shadow-xl rounded-lg bg-card border-border">
        <CardHeader className="p-6 sm:p-8">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline font-bold text-primary">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {groupId 
              ? `Your payment for group (ID: ${groupId}) has been successfully processed.` 
              : "Your payment has been successfully processed."}
          </CardDescription>
          
          {orderId && paymentId && (
            <div className="text-sm text-muted-foreground mb-6 space-y-1 bg-muted p-4 rounded-md">
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Payment ID:</strong> {paymentId}</p>
            </div>
          )}
          
          <p className="text-muted-foreground text-sm mb-6">
            A confirmation email has been sent with your transaction details. You can now manage your group registrations from your dashboard.
          </p>
          
          <Button asChild size="lg" className="w-full text-lg py-3 mb-4">
            <Link href="/dance-school/dashboard">
              <Users className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
             <Link href="/ssc/home">
                <Home className="mr-2 h-5 w-5" />
                 Return to Main Homepage
             </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
