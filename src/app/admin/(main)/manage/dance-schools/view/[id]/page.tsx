
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type DanceSchool } from '../../page'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function ViewDanceSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;
  const { toast } = useToast();

  const [schoolData, setSchoolData] = useState<DanceSchool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    setIsLoading(true);
    if(firebaseInitializationError || !db) {
      toast({ title: "Database Error", description: "Firebase is not configured.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const fetchSchool = async () => {
      try {
        const docRef = doc(db, 'dance-schools', schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchoolData({ id: docSnap.id, ...docSnap.data() } as DanceSchool);
        } else {
          toast({ title: "Error", description: "Dance school not found.", variant: "destructive" });
          router.push('/admin/manage/dance-schools');
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load dance school data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchool();
  }, [schoolId, router, toast]);


  if (isLoading || !schoolData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading school details...</p>
      </div>
    );
  }
  
  const formatDate = (timestamp: any) => {
     if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp && typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
    }
    return 'N/A';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/dance-schools"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">View Dance School</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{schoolData.danceSchoolName}</CardTitle>
          <CardDescription>
            Detailed information for the dance school.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Teacher Name</p>
              <p className="text-lg text-foreground">{schoolData.danceTeacherName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="text-lg text-foreground">{schoolData.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="text-lg text-foreground">{schoolData.phone}</p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">City</p>
              <p className="text-lg text-foreground">{schoolData.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="text-lg text-foreground">{schoolData.country}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registered On</p>
              <p className="text-lg text-foreground">{formatDate(schoolData.createdAt)}</p>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
             <Button onClick={() => router.push(`/admin/manage/dance-schools/edit/${schoolData.id}`)}>
                Edit School
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
