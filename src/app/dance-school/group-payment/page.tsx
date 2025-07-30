
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BadgeDollarSign, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { initiatePaymentTransaction } from '@/app/payment/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { type Event } from '@/lib/initial-data';


declare global {
  interface Window {
    Razorpay: any;
  }
}

interface GroupData {
  id: string;
  groupName: string;
  danceSchoolId: string;
  studentCount: number;
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  eventId?: string;
}

interface DanceSchoolSessionData {
  schoolId: string;
  schoolName: string;
  email: string;
}

const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';

export default function GroupPaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [danceSchoolName, setDanceSchoolName] = useState<string>('');
  const [totalAmountInPaise, setTotalAmountInPaise] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const gid = searchParams.get('groupId');
    if (!gid) {
      toast({ title: "Error", description: "Group ID missing.", variant: "destructive" });
      router.push('/dance-school/dashboard');
      return;
    }
    setGroupId(gid);
    
    const sessionString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    if (!sessionString) {
      toast({ title: "Error", description: "No active session.", variant: "destructive" });
      router.push('/dance-school/login');
      return;
    }
    try {
      const session: DanceSchoolSessionData = JSON.parse(sessionString);
      setDanceSchoolName(session.schoolName);
    } catch (e) {
      toast({ title: "Session Error", variant: "destructive" });
      router.push('/dance-school/login');
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupAndEventData = async () => {
        setIsLoadingData(true);
        if (firebaseInitializationError || !db) {
            toast({ title: "Database Error", variant: "destructive" });
            router.push('/dance-school/dashboard');
            return;
        }

        try {
            const groupDocRef = doc(db, 'groups', groupId);
            const docSnap = await getDoc(groupDocRef);

            if (docSnap.exists()) {
                const group = { id: docSnap.id, ...docSnap.data() } as GroupData;
                setGroupData(group);

                if (group.paymentStatus === 'paid') {
                    toast({ title: "Payment Info", description: "This group has already been paid for.", variant: "default" });
                }

                if (group.eventId) {
                    const eventDocRef = doc(db, 'events', group.eventId);
                    const eventSnap = await getDoc(eventDocRef);
                    if(eventSnap.exists()) {
                        const event = { id: eventSnap.id, ...eventSnap.data() } as Event;
                        setEventData(event);
                        // For groups, assume the first registration type is the one to use, or define more specific logic if needed.
                        const price = event.registrationTypes?.[0]?.price || 0;
                        setTotalAmountInPaise(group.studentCount * price * 100);
                    } else {
                        toast({ title: "Event Error", description: "Could not find event details for this group.", variant: "destructive" });
                    }
                }

            } else {
                toast({ title: "Error", description: "Group data not found.", variant: "destructive" });
                router.push('/dance-school/dashboard');
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not load group details.", variant: "destructive" });
            router.push('/dance-school/dashboard');
        } finally {
            setIsLoadingData(false);
        }
    };

    fetchGroupAndEventData();
  }, [groupId, router, toast]);

  const onPaymentSuccess = useCallback(async (paymentResponse: any) => {
    if (!groupData || !db) return;
    setIsProcessing(true);

    const paymentRecord = {
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      paidAmount: totalAmountInPaise / 100,
      currency: 'INR',
      paidOn: new Date().toISOString(),
      groupId: groupData.id,
      danceSchoolId: groupData.danceSchoolId,
      paymentType: 'group_registration',
      status: 'successful'
    };
    
    try {
        const batch = writeBatch(db);
        // 1. Create payment record
        const paymentDocRef = doc(collection(db, "group_payments"));
        batch.set(paymentDocRef, paymentRecord);

        // 2. Update group status
        const groupDocRef = doc(db, 'groups', groupData.id);
        batch.update(groupDocRef, { paymentStatus: 'paid', paymentId: paymentDocRef.id });
        
        await batch.commit();

        toast({ title: "Payment Successful!", description: "Group payment completed."});
        router.push(`/dance-school/payment-success?orderId=${paymentRecord.razorpay_order_id}&paymentId=${paymentRecord.razorpay_payment_id}&groupId=${groupData.id}`);

    } catch (e) {
        console.error("Error saving payment/group data to Firestore:", e);
        toast({ title: "Storage Error", description: "Could not save payment or update group status.", variant: "destructive" });
        setIsProcessing(false);
    }
  }, [groupData, totalAmountInPaise, toast, router, db]);

  const handlePayment = async () => {
    if (!groupData) {
      toast({ title: "Error", description: "Group data not loaded.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    const paymentInitiationFormData = new FormData();
    paymentInitiationFormData.append('totalAmount', String(totalAmountInPaise));
    paymentInitiationFormData.append('currency', 'INR');
    paymentInitiationFormData.append('groupId', groupData.id);
    paymentInitiationFormData.append('danceSchoolId', groupData.danceSchoolId);
    paymentInitiationFormData.append('studentCount', String(groupData.studentCount));

    const initiationResult = await initiatePaymentTransaction(paymentInitiationFormData);
    
    if (initiationResult.error || !initiationResult.orderId) {
      toast({ title: "Payment Init Failed", description: initiationResult.error || "Could not create order.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    const options = {
      key: initiationResult.keyId,
      amount: initiationResult.amount,
      currency: initiationResult.currency,
      name: danceSchoolName || "Sadhanai Sigaram Event Payment",
      description: `Payment for Group: ${groupData.groupName} - Event: ${eventData?.eventTitle}`,
      order_id: initiationResult.orderId,
      handler: onPaymentSuccess,
      prefill: { email: groupData?.id ? localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY) ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY)!).email : '' : '' },
      notes: initiationResult.notes,
      theme: { color: "#cd2122" }
    };

    if (!window.Razorpay) {
      toast({ title: "Error", description: "Razorpay SDK not loaded.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
      setIsProcessing(false);
    });
    rzp.open();
  };


  if (isLoadingData || !groupData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="mt-3 text-foreground">Loading group payment details...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 py-8 px-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-xl rounded-lg">
          <CardHeader className="pb-4 text-center">
            <Users className="mx-auto h-12 w-12 text-accent mb-2" />
            <CardTitle className="text-xl sm:text-2xl font-semibold text-accent">{groupData.groupName}</CardTitle>
            <CardDescription className="text-muted-foreground">
                For Event: {eventData?.eventTitle || '...'}
            </CardDescription>
            <CardDescription>
              {groupData.studentCount} Student{groupData.studentCount > 1 ? 's' : ''} - Total: ₹{(totalAmountInPaise / 100).toFixed(2)}
            </CardDescription>
             {groupData.paymentStatus === 'paid' && (
                <p className="text-sm text-green-500 mt-1">(Payment Completed)</p>
            )}
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="my-4 rounded-md overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1594868453472-5a0a7d57864f?q=80&w=600&h=300&fit=crop"
                  alt="Group event visual"
                  width={600}
                  height={300}
                  className="w-full h-auto object-cover"
                  data-ai-hint="dance group"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="acceptTerms" name="acceptTerms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} required />
                <Label htmlFor="acceptTerms" className="text-sm font-medium leading-none">Accept Terms & Conditions <span className="text-destructive">*</span></Label>
              </div>
              <Button type="button" onClick={handlePayment} disabled={isProcessing || isLoadingData || groupData.paymentStatus === 'paid'} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-md">
                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BadgeDollarSign className="mr-2 h-5 w-5" />}
                {groupData.paymentStatus === 'paid' ? 'Payment Complete' : `Pay ₹${(totalAmountInPaise / 100).toFixed(2)} Now`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
