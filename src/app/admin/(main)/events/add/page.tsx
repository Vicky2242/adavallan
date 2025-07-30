
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the type for the data to be stored in Firestore, excluding the client-side 'id'
type EventForFirestore = Omit<Event, 'id'> & { createdAt: any };

export default function AddEventPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Event, 'id' | 'registrationTypes'>>({
    eventTitle: '',
    date: '',
    category: '',
    location: '',
    mapUrl: '',
    description: '',
    registrationStatus: 'scheduled',
    registrationStartDate: '',
    registrationEndDate: '',
  });
  const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([
    { id: Date.now().toString(), name: '', price: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const newRegTypes = registrationTypes.filter((_, i) => i !== index);
      setRegistrationTypes(newRegTypes);
    } else {
      toast({ title: "Action Denied", description: "At least one registration type is required.", variant: "default"});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly. Cannot save event.", variant: "destructive" });
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
    
    const newEventData: EventForFirestore = {
      ...formData,
      registrationTypes,
      createdAt: serverTimestamp(),
    };

    try {
      const eventsCollection = collection(db, "events");
      await addDoc(eventsCollection, newEventData);

      toast({ title: "Success", description: "New event added to Firestore successfully." });
      router.push('/admin/events');
    } catch (error) {
      console.error("Failed to save new event to Firestore", error);
      toast({ title: "Error", description: "Could not save new event data to Firestore.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/events"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Event Details</CardTitle>
            <CardDescription>Fill in the information for the new event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="eventTitle">Event Title <span className="text-destructive">*</span></Label><Input id="eventTitle" name="eventTitle" value={formData.eventTitle} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="date">Date & Time <span className="text-destructive">*</span></Label><Input id="date" name="date" type="datetime-local" value={formData.date} onChange={handleChange} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="category">Category <span className="text-destructive">*</span></Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g., Workshop, Performance"/></div>
              <div className="space-y-2"><Label htmlFor="location">Location Address <span className="text-destructive">*</span></Label><Input id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., 123 Event St, Chennai" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="mapUrl">Google Map URL</Label><Input id="mapUrl" name="mapUrl" type="url" value={formData.mapUrl} onChange={handleChange} placeholder="https://maps.app.goo.gl/..." /></div>
            <div className="space-y-2"><Label htmlFor="description">Description <span className="text-destructive">*</span></Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="min-h-[150px]" placeholder="Enter detailed event description here."/></div>
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
              <div className="space-y-2"><Label htmlFor="registrationStartDate">Registration Start</Label><Input id="registrationStartDate" name="registrationStartDate" type="datetime-local" value={formData.registrationStartDate} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="registrationEndDate">Registration End</Label><Input id="registrationEndDate" name="registrationEndDate" type="datetime-local" value={formData.registrationEndDate} onChange={handleChange} /></div>
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
            Add Event
          </Button>
        </div>
      </form>
    </div>
  );
}
