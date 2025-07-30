
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

export default function AddDanceSchoolPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    danceSchoolName: '',
    danceTeacherName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
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
        toast({ title: "Database Error", description: "Firebase is not configured correctly. Cannot save school.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    if (!formData.danceSchoolName || !formData.danceTeacherName || !formData.email || !formData.phone || !formData.city || !formData.country) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const newSchool = {
      ...formData,
      createdAt: serverTimestamp(),
      // Note: No password is set from the admin panel. The school would need a way to set it.
    };

    try {
      await addDoc(collection(db, "dance-schools"), newSchool);
      toast({ title: "Success", description: "New dance school added successfully." });
      router.push('/admin/manage/dance-schools');
    } catch (error) {
      console.error("Failed to save new dance school to Firestore", error);
      toast({ title: "Error", description: "Could not save new dance school data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/dance-schools"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Dance School</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New School Details</CardTitle>
          <CardDescription>
            Fill in the information for the new dance school. A password should be set by the school later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="danceSchoolName">School Name <span className="text-destructive">*</span></Label>
                <Input id="danceSchoolName" name="danceSchoolName" value={formData.danceSchoolName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="danceTeacherName">Teacher Name <span className="text-destructive">*</span></Label>
                <Input id="danceTeacherName" name="danceTeacherName" value={formData.danceTeacherName} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                <Input id="country" name="country" value={formData.country} onChange={handleChange} required />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/dance-schools')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add School
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
