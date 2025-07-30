
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Coupon } from '../../page'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Coupon>>({});
  const [originalCouponCode, setOriginalCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!couponId) return;
    if (firebaseInitializationError || !db) {
      toast({ title: "Database Error", description: "Cannot load data from Firestore.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const fetchCoupon = async () => {
        try {
            const docRef = doc(db, 'coupons', couponId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const couponData = docSnap.data() as Omit<Coupon, 'id'>;
                setFormData({
                    couponCode: couponData.couponCode,
                    discount: couponData.discount,
                    available: couponData.available,
                    used: couponData.used,
                });
                setOriginalCouponCode(couponData.couponCode);
            } else {
                toast({ title: "Error", description: "Coupon not found.", variant: "destructive" });
                router.push('/admin/manage/coupons');
            }
        } catch(e) {
            toast({ title: "Error", description: "Could not fetch coupon data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchCoupon();
  }, [couponId, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? (value === '' ? undefined : parseInt(value, 10)) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!db) return;
    setIsSubmitting(true);

    if (!formData.couponCode || !formData.discount || (formData.available !== undefined && formData.available < 0) || (formData.used !== undefined && formData.used < 0)) {
        toast({ title: "Invalid Data", description: "Please fill in all required fields and ensure counts are not negative.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const docRef = doc(db, 'coupons', couponId);
      await updateDoc(docRef, { ...formData });
      toast({ title: "Success", description: "Coupon updated successfully." });
      router.push('/admin/manage/coupons');
    } catch (error) {
       toast({ title: "Error", description: "Failed to save updated coupon data.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/coupons"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Coupon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Coupon Details</CardTitle>
          <CardDescription>
            Modify the information for coupon: "{originalCouponCode}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="couponCode">Coupon Code <span className="text-destructive">*</span></Label>
                    <Input id="couponCode" name="couponCode" value={formData.couponCode || ''} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount">Discount <span className="text-destructive">*</span></Label>
                    <Input id="discount" name="discount" value={formData.discount || ''} onChange={handleChange} required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="available">Available (Count) <span className="text-destructive">*</span></Label>
                    <Input id="available" name="available" type="number" value={formData.available ?? ''} onChange={handleChange} required min="0" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="used">Used (Count)</Label>
                    <Input id="used" name="used" type="number" value={formData.used ?? ''} onChange={handleChange} min="0" />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/coupons')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
