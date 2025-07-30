
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
import { type DanceSchool } from '../../page'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditDanceSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Omit<DanceSchool, 'id' | 'createdAt'>>>({});
  const [originalSchoolName, setOriginalSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    setIsLoading(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot load data from Firestore.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const fetchSchool = async () => {
        try {
            const docRef = doc(db, 'dance-schools', schoolId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const schoolData = docSnap.data() as Omit<DanceSchool, 'id'>;
                setFormData(schoolData);
                setOriginalSchoolName(schoolData.danceSchoolName);
            } else {
                toast({ title: "Error", description: "Dance School not found.", variant: "destructive" });
                router.push('/admin/manage/dance-schools');
            }
        } catch (e) {
            console.error("Error fetching dance school:", e);
            toast({ title: "Error", description: "Could not fetch dance school data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchSchool();
  }, [schoolId, router, toast]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    if (!formData.danceSchoolName || !formData.danceTeacherName || !formData.email || !formData.phone || !formData.city || !formData.country) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const docRef = doc(db, 'dance-schools', schoolId);
        // Exclude password and createdAt from the update data from admin panel
        const { password, createdAt, ...updateData } = formData;
        await updateDoc(docRef, updateData);
        toast({ title: "Success", description: "Dance school updated successfully." });
        router.push('/admin/manage/dance-schools');
    } catch (error) {
       toast({ title: "Error", description: "Failed to save updated school data.", variant: "destructive" });
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
          <Link href="/admin/manage/dance-schools"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Dance School</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">School Details</CardTitle>
          <CardDescription>
            Modify information for: "{originalSchoolName}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="danceSchoolName">School Name <span className="text-destructive">*</span></Label>
                <Input id="danceSchoolName" name="danceSchoolName" value={formData.danceSchoolName || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="danceTeacherName">Teacher Name <span className="text-destructive">*</span></Label>
                <Input id="danceTeacherName" name="danceTeacherName" value={formData.danceTeacherName || ''} onChange={handleChange} required />
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span> (Cannot be changed)</Label>
                <Input id="email" name="email" type="email" value={formData.email || ''} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                <Input id="city" name="city" value={formData.city || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                <Input id="country" name="country" value={formData.country || ''} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/dance-schools')}>
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
