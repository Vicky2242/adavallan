
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
import type { Country } from '../../page'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


export default function EditCountryPage() {
  const router = useRouter();
  const params = useParams();
  const countryId = params.id as string;
  const { toast } = useToast();

  const [countryName, setCountryName] = useState('');
  const [originalCountryName, setOriginalCountryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!countryId) return;
    if (firebaseInitializationError || !db) {
      toast({ title: "Database Error", description: "Cannot load data from Firestore.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const fetchCountry = async () => {
        try {
            const docRef = doc(db, 'countries', countryId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const countryData = docSnap.data() as Omit<Country, 'id'>;
                setCountryName(countryData.name);
                setOriginalCountryName(countryData.name);
            } else {
                toast({ title: "Error", description: "Country not found.", variant: "destructive" });
                router.push('/admin/manage/countries');
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not fetch country data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchCountry();
  }, [countryId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim()) {
        toast({ title: "Missing Field", description: "Please enter the country name.", variant: "destructive" });
        return;
    }
    if (!db) return;
    setIsSubmitting(true);
    
    try {
      const docRef = doc(db, 'countries', countryId);
      await updateDoc(docRef, { name: countryName.trim() });
      toast({ title: "Success", description: "Country updated successfully." });
      router.push('/admin/manage/countries');
    } catch (error) {
       toast({ title: "Error", description: "Failed to save updated country data.", variant: "destructive" });
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
          <Link href="/admin/manage/countries"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Country</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Country Details</CardTitle>
          <CardDescription>Modify the name for: "{originalCountryName}"</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="countryName">Country Name <span className="text-destructive">*</span></Label>
                <Input id="countryName" name="countryName" value={countryName} onChange={(e) => setCountryName(e.target.value)} required />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/countries')}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
