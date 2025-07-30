
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, LogIn, LogOut, VideoOff, User, Calendar, Clock, Loader2 } from 'lucide-react';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';

interface ScanLog {
  participantId: string;
  inTime?: string;
  outTime?: string;
  createdAt?: any;
}

interface IndividualApplicant {
  participantId: string;
  participantName?: string;
  applicantName?: string;
  eventId?: string;
}

interface GroupParticipant {
  groupId: string;
  participantId: string;
  participantName: string;
}

interface GroupData {
  id: string;
  eventId?: string;
}

interface Event {
  id: string;
  eventTitle: string;
  date: string;
}

interface ScannedInfo {
  participantId: string;
  name: string;
  eventName: string;
  inTime?: string;
  outTime?: string;
}

export default function ScannerPage() {
  const { toast } = useToast();
  const [scannedParticipantDetails, setScannedParticipantDetails] = useState<ScannedInfo | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const findParticipantDetails = useCallback(async (participantId: string) => {
    setIsSearching(true);
    setScannedParticipantDetails(null);
    
    if (firebaseInitializationError || !db) {
      toast({ title: "Database Error", variant: "destructive" });
      setIsSearching(false);
      return;
    }

    try {
      let name: string | undefined;
      let eventId: string | undefined;

      const individualRegsQuery = query(collection(db, "registrations"));
      const groupParticipantsQuery = query(collection(db, "group_participants"));

      const [individualRegsSnapshot, groupParticipantsSnapshot] = await Promise.all([
        getDocs(individualRegsQuery),
        getDocs(groupParticipantsQuery)
      ]);

      for (const doc of individualRegsSnapshot.docs) {
        const data = doc.data() as IndividualApplicant;
        if (data.participantId === participantId) {
          name = data.participantName || data.applicantName;
          eventId = data.eventId;
          break;
        }
      }

      if (!name) {
        for (const doc of groupParticipantsSnapshot.docs) {
          const data = doc.data() as GroupParticipant;
          if (data.participantId === participantId) {
            name = data.participantName;
            const groupDoc = await getDoc(doc(db, "groups", data.groupId));
            if (groupDoc.exists()) {
              eventId = (groupDoc.data() as GroupData).eventId;
            }
            break;
          }
        }
      }

      if (!name || !eventId) {
        toast({ title: "Not Found", description: `Participant with ID ${participantId} not found.`, variant: "destructive" });
        setIsSearching(false);
        return;
      }
      
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventName = eventDoc.exists() ? (eventDoc.data() as Event).eventTitle : 'N/A';
      
      const logDoc = await getDoc(doc(db, "hallTicketScans", participantId));
      const logData = logDoc.exists() ? logDoc.data() as ScanLog : null;
      
      const details: ScannedInfo = {
        participantId: participantId,
        name: name,
        eventName: eventName,
        inTime: logData?.inTime ? new Date(logData.inTime).toLocaleString() : undefined,
        outTime: logData?.outTime ? new Date(logData.outTime).toLocaleString() : undefined,
      };

      setScannedParticipantDetails(details);
      toast({ title: "Participant Found!", description: `Details for ${name} loaded.` });

    } catch (e) {
      console.error("Error finding participant details:", e);
      toast({ title: "Error", description: "Could not process participant data.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);
  
  const qrCodeSuccessCallback = useCallback((decodedText: string) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScannerActive(false); 
    findParticipantDetails(decodedText);
  }, [findParticipantDetails]);

  const startScanner = async () => {
    if (isScannerActive || !html5QrCodeRef.current) return;
    try {
      await Html5Qrcode.getCameras();
      setScannedParticipantDetails(null);
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      html5QrCodeRef.current.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
        .then(() => setIsScannerActive(true))
        .catch(err => {
          console.error("Error starting QR scanner:", err);
          toast({ title: "Scanner Error", description: "Could not start camera. Check permissions.", variant: "destructive" });
        });
    } catch (err) {
      toast({ title: "Camera Error", description: "No camera found or permissions denied.", variant: "destructive" });
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScannerActive(false);
    setScannedParticipantDetails(null);
  };
  
  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(err => console.error("Cleanup stop failed", err));
        }
    };
  }, []);

  const handleLogScan = async (scanType: 'in' | 'out') => {
    if (!scannedParticipantDetails || !db) return;

    const logDocRef = doc(db, 'hallTicketScans', scannedParticipantDetails.participantId);
    
    try {
        const logDocSnap = await getDoc(logDocRef);
        const nowISO = new Date().toISOString();
        if (!logDocSnap.exists()) {
            await setDoc(logDocRef, { participantId: scannedParticipantDetails.participantId, [scanType === 'in' ? 'inTime' : 'outTime']: nowISO, createdAt: serverTimestamp() });
        } else {
            await updateDoc(logDocRef, { [scanType === 'in' ? 'inTime' : 'outTime']: nowISO });
        }
        toast({ title: "Log Saved!", description: `Participant ${scannedParticipantDetails.name} logged for ${scanType === 'in' ? 'In-Time' : 'Out-Time'}.` });
        findParticipantDetails(scannedParticipantDetails.participantId);
    } catch(e) {
      console.error("Failed to save scan log to Firestore:", e);
      toast({ title: "Storage Error", description: "Could not save the scan log.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <ScanLine className="mr-3 h-6 w-6" /> Barcode Scanner
          </CardTitle>
          <CardDescription>Scan participant barcodes for In-Time and Out-Time logging.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div id="qr-reader" className="w-full max-w-md border-2 border-dashed rounded-lg overflow-hidden">
            {!isScannerActive && (
              <div className="bg-muted h-64 flex flex-col items-center justify-center text-muted-foreground">
                <VideoOff className="h-16 w-16 mb-4" />
                <p>Scanner is off. Click below to start.</p>
              </div>
            )}
          </div>
          <div>
            {!isScannerActive ? <Button onClick={startScanner}>Start Scanner</Button> : <Button onClick={stopScanner} variant="destructive">Stop Scanner</Button>}
          </div>
          {isSearching && <div className="flex flex-col items-center justify-center text-muted-foreground p-4"><Loader2 className="h-8 w-8 animate-spin" /><p className="mt-2">Searching for participant...</p></div>}
          {scannedParticipantDetails && !isSearching && (
            <Card className="w-full max-w-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CardHeader><CardTitle className="text-lg text-green-800 dark:text-green-300">Participant Details</CardTitle><CardDescription className="text-green-700 dark:text-green-400">Log entry or exit time below.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2 text-sm text-foreground">
                    <p className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Name:</strong><span className="ml-2">{scannedParticipantDetails.name}</span></p>
                    <p className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-muted-foreground"/><strong>ID:</strong><span className="ml-2 font-mono">{scannedParticipantDetails.participantId}</span></p>
                    <p className="flex items-center"><Calendar className="mr-2 h-4 w-4 text-muted-foreground"/><strong>Event:</strong><span className="ml-2">{scannedParticipantDetails.eventName}</span></p>
                 </div>
                 <div className="space-y-2 text-sm">
                    <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary"/><strong>In-Time:</strong><span className="ml-2 font-semibold text-primary">{scannedParticipantDetails.inTime || 'Not Logged'}</span></p>
                    <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary"/><strong>Out-Time:</strong><span className="ml-2 font-semibold text-primary">{scannedParticipantDetails.outTime || 'Not Logged'}</span></p>
                 </div>
                 <div className="flex justify-around mt-4">
                    <Button onClick={() => handleLogScan('in')}><LogIn className="mr-2 h-4 w-4" /> Log In-Time</Button>
                    <Button onClick={() => handleLogScan('out')} variant="secondary"><LogOut className="mr-2 h-4 w-4" /> Log Out-Time</Button>
                  </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
