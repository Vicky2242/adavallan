
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Frown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, setDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';


// Interfaces for Firestore data
interface IndividualApplicant {
  participantId: string;
  applicantName?: string;
  participantName?: string;
  eventId?: string;
}

interface GroupParticipant {
  participantId: string;
  participantName: string;
  groupId: string;
}

interface GroupData {
  id: string;
  eventId?: string;
}

interface EventData {
    id: string;
    eventTitle: string;
    date: string;
    location: string;
}

interface ScanLog {
  participantId: string;
  inTime?: string;
  outTime?: string;
}

interface ParticipantDetails {
  participantId: string;
  name: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
}

type ScanStatus = {
    type: 'success' | 'error' | 'info';
    message: string;
    details?: ParticipantDetails;
}

export default function HallTicketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const { toast } = useToast();

  const findParticipant = useCallback(async (participantId: string): Promise<ParticipantDetails | null> => {
    if(firebaseInitializationError || !db) {
        toast({ title: "Database Error", variant: "destructive" });
        return null;
    }
    try {
        let name: string | undefined;
        let eventId: string | undefined;

        // Check individual registrations
        const individualRegsQuery = query(collection(db, "registrations"));
        const individualRegsSnapshot = await getDocs(individualRegsQuery);
        for (const doc of individualRegsSnapshot.docs) {
          const data = doc.data() as IndividualApplicant;
          if (data.participantId === participantId) {
            name = data.participantName || data.applicantName;
            eventId = data.eventId;
            break;
          }
        }
        
        if (!name) {
            // Check group participants
            const groupParticipantsQuery = query(collection(db, "group_participants"));
            const groupParticipantsSnapshot = await getDocs(groupParticipantsQuery);
             for (const doc of groupParticipantsSnapshot.docs) {
                const data = doc.data() as GroupParticipant;
                if (data.participantId === participantId) {
                    name = data.participantName;
                    const groupsQuery = query(collection(db, "groups"));
                    const groupsSnapshot = await getDocs(groupsQuery);
                    const allGroups = groupsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as GroupData);
                    const group = allGroups.find(g => g.id === data.groupId);
                    eventId = group?.eventId;
                    break;
                }
            }
        }

        if (!name || !eventId) return null;

        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (!eventDoc.exists()) return null;
        const event = eventDoc.data() as EventData;
        const eventDateObj = new Date(event.date);

        return {
            participantId: participantId,
            name: name,
            eventName: event.eventTitle,
            eventDate: eventDateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
            eventTime: eventDateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            eventVenue: event.location,
        };
    } catch (error) {
        console.error("Error finding participant in Firestore:", error);
        toast({ title: "Error", description: "Failed to read registration data from Firestore.", variant: "destructive" });
        return null;
    }
  }, [toast]);
  
  const handleScanSubmit = async () => {
    if (!searchTerm.trim()) {
        toast({ title: 'Please enter a Participant ID', variant: 'destructive' });
        return;
    }
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setScanStatus(null);
    const participantId = searchTerm.trim();

    const participantDetails = await findParticipant(participantId);

    if (!participantDetails) {
        toast({ title: "Not Found", description: `Participant with ID ${participantId} not found.` });
        setScanStatus({ type: 'error', message: `Participant ID: ${participantId} was not found.` });
        setIsLoading(false);
        return;
    }

    const logDocRef = doc(db, 'hallTicketScans', participantId);
    
    try {
        const logDocSnap = await getDoc(logDocRef);
        const now = new Date();

        if (!logDocSnap.exists()) {
            await setDoc(logDocRef, { participantId, inTime: now.toISOString(), createdAt: serverTimestamp() });
            setScanStatus({ type: 'success', message: `Welcome! Entry recorded for ${participantDetails.name}.`, details: participantDetails });
            toast({ title: "Check-In Success", description: `In-Time: ${now.toLocaleString()}` });
        } else {
            const logData = logDocSnap.data();
            if (!logData.outTime) {
                await updateDoc(logDocRef, { outTime: now.toISOString() });
                setScanStatus({ type: 'success', message: `Thank you for Participating, ${participantDetails.name}!`, details: participantDetails });
                toast({ title: "Check-Out Success", description: `Out-Time: ${now.toLocaleString()}` });
            } else {
                setScanStatus({ type: 'error', message: `Participant ID: ${participantId} has Already Completed the event!`, details: participantDetails });
                toast({ title: "Already Completed", description: `In: ${new Date(logData.inTime).toLocaleString()}, Out: ${new Date(logData.outTime).toLocaleString()}`, variant: 'default' });
            }
        }
    } catch (error) {
        console.error("Error logging scan to Firestore:", error);
        toast({ title: "Error", description: "Failed to log scan time.", variant: "destructive" });
    }
    
    setIsLoading(false);
    setSearchTerm(''); // Clear input after submission
  };


  return (
    <div className="container mx-auto flex flex-col items-center py-12 md:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Event Check-in/out</h1>
        <p className="text-muted-foreground mt-2">Please enter your Participant ID to log your Hall Ticket time.</p>
      </div>

      <Card className="w-full max-w-xl text-center space-y-4 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-2 text-left">
            <Label htmlFor="participant-id">Participant ID:</Label>
             <div className="flex w-full items-center space-x-2">
              <Input
                id="participant-id"
                type="text"
                placeholder="Enter your participant ID"
                className="flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanSubmit()}
              />
            </div>
          </div>
           <Button onClick={handleScanSubmit} disabled={isLoading} className="w-full mt-4">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Submit
            </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8 w-full max-w-xl">
        {isLoading && (
            <div className="text-center p-10">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Verifying participant...</p>
            </div>
        )}

        {scanStatus && (
             <div className={`p-4 mb-4 rounded-md text-sm font-medium ${
                 scanStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                 : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
             }`}>
                {scanStatus.message}
             </div>
        )}
        
        {scanStatus?.details && (
            <Card className="text-left">
                <CardHeader>
                    <CardTitle>Participant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                   <p><strong>Participant ID:</strong> {scanStatus.details.participantId}</p>
                   <p><strong>Name:</strong> {scanStatus.details.name}</p>
                   <p><strong>Event Name:</strong> {scanStatus.details.eventName}</p>
                   <p><strong>Date:</strong> {scanStatus.details.eventDate}</p>
                   <p><strong>Venue:</strong> {scanStatus.details.eventVenue}</p>
                   <p><strong>Time:</strong> {scanStatus.details.eventTime}</p>
                </CardContent>
            </Card>
        )}

        {!isLoading && !scanStatus && (
            <div className="text-center p-10 rounded-lg bg-muted/50">
                <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Please start a search to see details.</p>
            </div>
        )}
      </div>
    </div>
  );
}
