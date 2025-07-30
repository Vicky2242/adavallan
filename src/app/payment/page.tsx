
'use client';

import React, { useState, useEffect, useRef, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BadgeDollarSign, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { initiatePaymentTransaction, verifyAndSubmitPayment, type PaymentVerificationFormState } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const initialState: PaymentVerificationFormState = undefined;


declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const [state, formAction] = React.useActionState(verifyAndSubmitPayment, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [acceptTerms, setAcceptTerms] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [participantIdForPayment, setParticipantIdForPayment] = useState('');
  const [amountInRupees, setAmountInRupees] = useState<number | null>(null);


  useEffect(() => {
    const pidFromQuery = searchParams.get('participantId');
    const amountFromQuery = searchParams.get('amount');

    if (pidFromQuery) {
      setParticipantIdForPayment(pidFromQuery);
    } else {
      toast({ title: "Error", description: "Participant ID missing. Please restart registration.", variant: "destructive" });
      router.push('/register');
      return;
    }
    
    if (amountFromQuery && !isNaN(parseFloat(amountFromQuery))) {
      setAmountInRupees(parseFloat(amountFromQuery));
    } else {
       toast({ title: "Error", description: "Registration fee missing or invalid. Please restart registration.", variant: "destructive" });
       router.push('/register');
       return;
    }

    const scriptId = 'razorpay-checkout-script';
    if (document.getElementById(scriptId)) {
        return; // Script already added
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

  }, [searchParams, router, toast]);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? "Payment Notice" : "Payment Error",
        description: state.issues?.join("\\n") || state.message,
        variant: state.success ? "default" : "destructive",
      });
    }

    if (state?.success && state.paymentData) {
        setIsProcessing(false);
        router.push(`/success?orderId=${state.paymentData.razorpay_order_id}&paymentId=${state.paymentData.razorpay_payment_id}`);
    } else if (state && !state.success) {
        setIsProcessing(false);
    }
  }, [state, toast, router]);

  const handlePayment = async () => {
    if (!formRef.current) return;
    if (!acceptTerms) {
      toast({ title: "Terms not accepted", description: "You must accept the terms and conditions.", variant: "destructive" });
      return;
    }
    if (!participantIdForPayment || amountInRupees === null) {
        toast({ title: "Missing Information", description: "Participant or amount details are missing.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);

    const amountInPaise = Math.round(amountInRupees * 100);
    const paymentInitiationFormData = new FormData();
    paymentInitiationFormData.append('totalAmount', String(amountInPaise));
    paymentInitiationFormData.append('participantId', participantIdForPayment);

    const initiationResult = await initiatePaymentTransaction(paymentInitiationFormData);

    if (initiationResult.error || !initiationResult.orderId || !initiationResult.keyId || !initiationResult.amount) {
      toast({ title: "Payment Init Failed", description: initiationResult.error || "Could not create order.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    const options = {
      key: initiationResult.keyId,
      amount: initiationResult.amount,
      currency: initiationResult.currency,
      name: "Sadhanai Sigaram Creations",
      description: "Event Registration Fee",
      image: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200&h=200&fit=crop",
      order_id: initiationResult.orderId,
      handler: function (response: any) {
        const verificationFormData = new FormData(formRef.current!);
        verificationFormData.set('participantId', participantIdForPayment);
        verificationFormData.set('razorpay_payment_id', response.razorpay_payment_id);
        verificationFormData.set('razorpay_order_id', response.razorpay_order_id);
        verificationFormData.set('razorpay_signature', response.razorpay_signature);
        verificationFormData.set('paidAmount', String(initiationResult.amount! / 100));
        verificationFormData.set('currency', initiationResult.currency!);
        verificationFormData.set('acceptTerms', String(acceptTerms));

        startTransition(() => {
          (formAction as (payload: FormData) => void)(verificationFormData);
        });
      },
      prefill: initiationResult.prefill,
      notes: initiationResult.notes,
      theme: { color: "#cd2122" }
    };

    if (!window.Razorpay) {
        toast({ title: "Error", description: "Razorpay SDK not loaded. Please refresh.", variant: "destructive" });
        setIsProcessing(false);
        return;
    }
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      toast({
        title: "Payment Failed",
        description: `Error: ${response.error.description || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
      setIsProcessing(false);
    });
    rzp.open();
  };


  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start bg-background py-8 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/register" passHref>
            <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground"><ArrowLeft className="h-6 w-6" /></Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Confirm Payment</h1>
        </div>

        <Card className="w-full shadow-xl rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} className="space-y-6">
              <div className="my-4 rounded-md overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1542487354-feaf934752e5?q=80&w=600&h=400&fit=crop"
                  alt="Upcoming record attempt visual"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  data-ai-hint="bharatanatyam dancer"
                />
              </div>

               <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Total Amount to Pay</p>
                  <p className="text-4xl font-bold text-foreground">
                    {amountInRupees !== null ? `₹${amountInRupees.toFixed(2)}` : <Loader2 className="h-8 w-8 animate-spin mx-auto" />}
                  </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon" className="text-foreground">Coupon</Label>
                <Input id="coupon" name="coupon" type="text" placeholder="Enter coupon code" className="bg-background border-border focus:ring-ring" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="acceptTerms" name="acceptTerms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} required />
                <Label htmlFor="acceptTerms" className="text-sm font-medium leading-none">Accept Terms & Conditions <span className="text-destructive">*</span></Label>
              </div>

              {state?.issues && <div className="rounded-md border border-destructive/50 p-3 bg-destructive/10"><ul className="list-disc list-inside text-sm text-destructive space-y-1">{state.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
              {state?.message && !state.issues && !state.success && <p className={`text-sm text-destructive`}>{state.message}</p>}

              <Button type="button" onClick={handlePayment} disabled={isProcessing || amountInRupees === null} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3 rounded-md">
                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BadgeDollarSign className="mr-2 h-5 w-5" />}
                Click To Pay
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
