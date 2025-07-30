
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Coupon } from '../page';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


export default function AddCouponPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'used'>>({
    couponCode: '',
    discount: '',
    available: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured. Cannot save coupon.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    if (!formData.couponCode || !formData.discount || formData.available <= 0) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields and ensure 'Available' is greater than 0.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const newCoupon = {
      ...formData,
      used: 0, 
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "coupons"), newCoupon);
      toast({ title: "Success", description: "New coupon added successfully." });
      router.push('/admin/manage/coupons');
    } catch (error) {
      console.error("Failed to save new coupon to Firestore", error);
      toast({ title: "Error", description: "Could not save new coupon data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/coupons"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Coupon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New Coupon Details</CardTitle>
          <CardDescription>
            Fill in the information for the new coupon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="couponCode">Coupon Code <span className="text-destructive">*</span></Label>
                    <Input
                    id="couponCode"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    required
                    placeholder="e.g., SUMMER25"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount">Discount <span className="text-destructive">*</span></Label>
                    <Input
                    id="discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 15% or ₹100"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="available">Available (Count) <span className="text-destructive">*</span></Label>
                <Input
                id="available"
                name="available"
                type="number"
                value={formData.available}
                onChange={handleChange}
                required
                min="1"
                placeholder="Number of times coupon can be used"
                />
            </div>


            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/coupons')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add Coupon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
