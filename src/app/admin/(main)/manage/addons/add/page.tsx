
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
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddAddonPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currency: 'INR',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured. Cannot save addon.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    if (!formData.title || !formData.amount || !formData.currency) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const newAddon = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "addons"), newAddon);
      toast({ title: "Success", description: "New addon added successfully." });
      router.push('/admin/manage/addons');
    } catch (error) {
      console.error("Failed to save new addon to Firestore", error);
      toast({ title: "Error", description: "Could not save new addon data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/addons"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Addon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New Addon Details</CardTitle>
          <CardDescription>
            Fill in the information for the new addon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Addon Title <span className="text-destructive">*</span></Label>
                <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Extra Workshop Session"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
                    <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 500.00"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Currency <span className="text-destructive">*</span></Label>
                    <Input
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    placeholder="e.g., INR"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/addons')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add Addon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
