

import React, { Suspense } from 'react';
import { type Event } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import RegistrationForm from './registration-form';
import { Loader2 } from 'lucide-react';
import { countriesWithStates } from '@/lib/location-data';


async function getOpenEvents(): Promise<Event[]> {
  if (firebaseInitializationError || !db) {
    console.error("Firebase not initialized. Cannot fetch events.");
    return [];
  }
  
  try {
    const eventsCollection = collection(db, "events");
    const q = query(eventsCollection, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
    
    const now = new Date();
    const currentlyOpenEvents = fetchedEvents.filter(event => {
      if (!event?.registrationStatus) return false;
      if (event.registrationStatus === 'open') return true;
      if (event.registrationStatus === 'closed') return false;
      if (event.registrationStatus === 'scheduled') {
        const start = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const end = event.registrationEndDate ? new Date(event.registrationEndDate) : null;
        if (start && end) return now >= start && now <= end;
        if (start) return now >= start;
        if (end) return now <= end;
      }
      return false;
    });
    return currentlyOpenEvents;
  } catch (error) {
    console.error("Failed to load events from Firestore for registration page", error);
    return [];
  }
}


export default async function RegisterPage() {
  const openEvents = await getOpenEvents();
  const countriesData = countriesWithStates;

  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <RegistrationForm openEvents={openEvents} countriesData={countriesData} />
    </Suspense>
  );
}
