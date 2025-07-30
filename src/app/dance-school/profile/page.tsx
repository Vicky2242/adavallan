
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, UserCircle, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';

interface DanceSchoolProfileData {
  id: string;
  danceSchoolName: string;
  danceTeacherName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  password?: string;
  profileImage?: string; // This can stay as data URI for profile pics
  createdAt?: string;
}

interface DanceSchoolSessionData {
  schoolId: string;
  schoolName: string;
  email: string;
}

export default function DanceSchoolProfilePage() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<Partial<DanceSchoolProfileData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const fetchProfileData = useCallback(async (schoolId: string) => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot load profile from Firestore.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    try {
        const docRef = doc(db, 'dance-schools', schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const schoolData = { id: docSnap.id, ...docSnap.data() } as DanceSchoolProfileData;
            setProfileData(schoolData);
            if (schoolData.profileImage) {
                setImagePreviewUrl(schoolData.profileImage);
            }
        } else {
             toast({ title: "Error", description: "Could not find your school's data.", variant: "destructive" });
        }
    } catch (e) {
        console.error("Error loading profile from Firestore", e);
        toast({ title: "Error", description: "Failed to load profile data from database.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    const sessionString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    if (!sessionString) {
      toast({ title: "Error", description: "No active session. Please log in.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    try {
      const session: DanceSchoolSessionData = JSON.parse(sessionString);
      setCurrentSchoolId(session.schoolId);
      fetchProfileData(session.schoolId);
    } catch (e) {
      console.error("Error parsing session data", e);
      toast({ title: "Error", description: "Invalid session data.", variant: "destructive" });
      setIsLoading(false);
    }
  }, [toast, fetchProfileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreviewUrl(dataUri);
        setProfileData(prev => ({ ...prev, profileImage: dataUri }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchoolId || !db) {
      toast({ title: "Error", description: "Session or database error. Cannot save.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    // Exclude fields that shouldn't be updated directly, like password and email
    const { id, email, password, createdAt, ...dataToUpdate } = profileData;

    try {
        const docRef = doc(db, 'dance-schools', currentSchoolId);
        await updateDoc(docRef, dataToUpdate);

        toast({ title: "Profile Updated", description: "Your school profile has been saved to the database." });

        if (profileData.danceSchoolName) {
             const sessionString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
             if(sessionString) {
                const session: DanceSchoolSessionData = JSON.parse(sessionString);
                session.schoolName = profileData.danceSchoolName;
                localStorage.setItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY, JSON.stringify(session));
             }
        }
    } catch (error) {
      console.error("Failed to save profile data to Firestore", error);
      toast({ title: "Error", description: "Could not save profile changes to the database.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">School Information</CardTitle>
          <CardDescription>
            Update your dance school's details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
                <Label>School Logo/Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreviewUrl ? (
                    <Image src={imagePreviewUrl} alt="School Logo Preview" width={80} height={80} className="rounded-md object-cover border-2 border-border" data-ai-hint="logo school" />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center border-2 border-border">
                      <UserCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                    </Button>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="danceSchoolName">School Name</Label>
                <Input id="danceSchoolName" name="danceSchoolName" value={profileData.danceSchoolName || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="danceTeacherName">Teacher Name</Label>
                <Input id="danceTeacherName" name="danceTeacherName" value={profileData.danceTeacherName || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Cannot be changed)</Label>
                <Input id="email" name="email" value={profileData.email || ''} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone</Label>
                <Input id="phoneNumber" name="phoneNumber" value={profileData.phoneNumber || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={profileData.address || ''} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={profileData.city || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" name="district" value={profileData.district || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={profileData.state || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={profileData.country || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
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

    