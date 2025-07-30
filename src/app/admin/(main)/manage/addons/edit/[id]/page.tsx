
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
import { type Addon } from '../../page';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


export default function EditAddonPage() {
  const router = useRouter();
  const params = useParams();
  const addonId = params.id as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState({ title: '', amount: '', currency: 'INR' });
  const [originalTitle, setOriginalTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!addonId) return;
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot load data from Firestore.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const fetchAddon = async () => {
        try {
            const docRef = doc(db, 'addons', addonId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const addonData = docSnap.data() as Omit<Addon, 'id'>;
                setFormData({
                    title: addonData.title,
                    amount: String(addonData.amount),
                    currency: addonData.currency,
                });
                setOriginalTitle(addonData.title);
            } else {
                toast({ title: "Error", description: "Addon not found.", variant: "destructive" });
                router.push('/admin/manage/addons');
            }
        } catch (e) {
            console.error("Error fetching addon:", e);
            toast({ title: "Error", description: "Could not fetch addon data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchAddon();
  }, [addonId, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

     if (!formData.title || !formData.amount || !formData.currency) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const docRef = doc(db, 'addons', addonId);
        await updateDoc(docRef, {
            title: formData.title,
            amount: parseFloat(formData.amount) || 0,
            currency: formData.currency,
        });
        toast({ title: "Success", description: "Addon updated successfully." });
        router.push('/admin/manage/addons');
    } catch (error) {
       toast({ title: "Error", description: "Failed to save updated addon data.", variant: "destructive" });
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
          <Link href="/admin/manage/addons"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Addon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Addon Details</CardTitle>
          <CardDescription>
            Modify the information for addon: "{originalTitle}"
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
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/addons')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
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
