
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Event, type RegistrationType } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Event, 'id' | 'registrationTypes'>>({
    eventTitle: '', date: '', category: '', location: '', mapUrl: '', description: '',
    registrationStatus: 'scheduled', registrationStartDate: '', registrationEndDate: '',
  });
  const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId || firebaseInitializationError || !db) {
        if (firebaseInitializationError) {
          toast({ title: "Database Error", description: "Firebase not configured.", variant: "destructive" });
        }
        setIsLoading(false);
        return;
    }

    const fetchEvent = async () => {
        setIsLoading(true);
        try {
            const eventDocRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(eventDocRef);

            if (docSnap.exists()) {
                const eventData = docSnap.data() as Omit<Event, 'id'>;
                const { registrationTypes, ...eventDetails } = eventData;
                setFormData(eventDetails);
                setRegistrationTypes(registrationTypes || [{ id: Date.now().toString(), name: '', price: 0 }]);
            } else {
                toast({ title: "Error", description: "Event not found in Firestore.", variant: "destructive" });
                router.push('/admin/events');
            }
        } catch (error) {
            console.error("Error fetching event from Firestore:", error);
            toast({ title: "Error", description: "Could not load event data from Firestore.", variant: "destructive" });
            router.push('/admin/events');
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchEvent();
  }, [eventId, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegTypeChange = (index: number, field: keyof Omit<RegistrationType, 'id'>, value: string | number) => {
    const newRegTypes = [...registrationTypes];
    newRegTypes[index] = { ...newRegTypes[index], [field]: value };
    setRegistrationTypes(newRegTypes);
  };

  const addRegType = () => {
    setRegistrationTypes([...registrationTypes, { id: Date.now().toString(), name: '', price: 0 }]);
  };

  const removeRegType = (index: number) => {
    if (registrationTypes.length > 1) {
      setRegistrationTypes(registrationTypes.filter((_, i) => i !== index));
    } else {
      toast({ title: "Action Denied", description: "At least one registration type is required.", variant: "default"});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot update. Firebase not configured.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    if (!formData.eventTitle || !formData.date || !formData.category || !formData.location || !formData.description) {
        toast({ title: "Missing Fields", description: "Please fill in all required event detail fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (registrationTypes.some(rt => rt.price < 0 || (registrationTypes.length > 1 && !rt.name))) {
       toast({ title: "Invalid Registration Types", description: "Price must be positive. Name is required for multiple types.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }

    try {
        const eventDocRef = doc(db, 'events', eventId);
        const updatedData = {
            ...formData,
            registrationTypes
        };
        await updateDoc(eventDocRef, updatedData);
        toast({ title: "Success", description: "Event updated successfully in Firestore." });
        router.push('/admin/events');
    } catch (error) {
       console.error("Error updating event in Firestore:", error);
       toast({ title: "Error", description: "Failed to save updated event data.", variant: "destructive" });
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
          <Link href="/admin/events"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Event Details</CardTitle>
            <CardDescription>Modify the information for event: "{formData.eventTitle}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="eventTitle">Event Title <span className="text-destructive">*</span></Label><Input id="eventTitle" name="eventTitle" value={formData.eventTitle} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="date">Date & Time <span className="text-destructive">*</span></Label><Input id="date" name="date" type="datetime-local" value={formData.date} onChange={handleChange} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="category">Category <span className="text-destructive">*</span></Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="location">Location Address <span className="text-destructive">*</span></Label><Input id="location" name="location" value={formData.location} onChange={handleChange} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="mapUrl">Google Map URL</Label><Input id="mapUrl" name="mapUrl" type="url" value={formData.mapUrl} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="description">Description <span className="text-destructive">*</span></Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="min-h-[150px]" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Registration Control</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={formData.registrationStatus} onValueChange={(value) => setFormData(prev => ({...prev, registrationStatus: value as any}))} className="flex space-x-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="open" id="reg-open" /><Label htmlFor="reg-open">Open Manually</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="closed" id="reg-closed" /><Label htmlFor="reg-closed">Close Manually</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="scheduled" id="reg-scheduled" /><Label htmlFor="reg-scheduled">Scheduled</Label></div>
            </RadioGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="registrationStartDate">Registration Start</Label><Input id="registrationStartDate" name="registrationStartDate" type="datetime-local" value={formData.registrationStartDate || ''} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="registrationEndDate">Registration End</Label><Input id="registrationEndDate" name="registrationEndDate" type="datetime-local" value={formData.registrationEndDate || ''} onChange={handleChange} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Registration Types <span className="text-destructive">*</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {registrationTypes.map((regType, index) => (
              <div key={regType.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-4 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`regTypeName-${index}`}>Name {registrationTypes.length > 1 && <span className="text-destructive">*</span>}</Label>
                  <Input id={`regTypeName-${index}`} value={regType.name} onChange={(e) => handleRegTypeChange(index, 'name', e.target.value)} placeholder="e.g., Online, Adult" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`regTypePrice-${index}`}>Price (INR) <span className="text-destructive">*</span></Label>
                  <Input id={`regTypePrice-${index}`} type="number" value={regType.price} onChange={(e) => handleRegTypeChange(index, 'price', parseFloat(e.target.value) || 0)} required />
                </div>
                 <Button type="button" variant="destructive" size="icon" onClick={() => removeRegType(index)} disabled={registrationTypes.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={addRegType}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Registration Type
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/events')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
