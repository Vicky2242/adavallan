
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

export default function AddCountryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [countryName, setCountryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim()) {
        toast({ title: "Missing Field", description: "Please enter the country name.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured. Cannot save country.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const newCountry = {
      name: countryName.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "countries"), newCountry);
      toast({ title: "Success", description: "New country added successfully." });
      router.push('/admin/manage/countries');
    } catch (error) {
      console.error("Failed to save new country to Firestore", error);
      toast({ title: "Error", description: "Could not save new country data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/countries"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Country</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New Country Details</CardTitle>
          <CardDescription>
            Enter the name for the new country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="countryName">Country Name <span className="text-destructive">*</span></Label>
              <Input
                id="countryName"
                name="countryName"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                required
                placeholder="e.g., Wonderland"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/countries')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add Country
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
