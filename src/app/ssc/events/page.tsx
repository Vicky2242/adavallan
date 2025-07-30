
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { type Event } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';


// NOTE: This page remains a client component to handle interactive filtering.
// Data fetching could be further optimized by passing initial data from a server component parent.

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  
  const fetchEvents = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const eventsCollection = collection(db, "events");
        // We order by date to show upcoming events first.
        const q = query(eventsCollection, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
        setEvents(eventsData);
    } catch (error) {
        console.error("Error fetching events from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch events data from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events.filter(event => {
      let eventDate;
      try {
        eventDate = new Date(event.date);
        if (isNaN(eventDate.getTime())) { // Check for invalid date
          console.warn(`Invalid date found for event "${event.eventTitle}": ${event.date}`);
          return false;
        }
      } catch (e) {
        console.warn(`Error parsing date for event "${event.eventTitle}": ${event.date}`, e);
        return false;
      }
      
      let isVisible = false;

      // Registration status logic
      if (event.registrationStatus === 'open') {
        isVisible = true;
      } else if (event.registrationStatus === 'scheduled') {
        const start = event.registrationStartDate ? new Date(event.registrationStartDate) : null;
        const end = event.registrationEndDate ? new Date(event.registrationEndDate) : null;
        if (start && end) {
           isVisible = now >= start && now <= end;
        } else if (start) {
           isVisible = now >= start;
        } else if (end) {
           isVisible = now <= end;
        }
      }
      // 'closed' status events are not shown

      if (!isVisible) return false;

      const matchesSearchTerm = event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                event.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDateFilter = !dateFilter || event.date.startsWith(dateFilter);

      return matchesSearchTerm && matchesDateFilter;
    });
  }, [events, searchTerm, dateFilter]);
  
  const handleGroupRegisterClick = (eventId: string, eventName: string) => {
    try {
      // Still using localStorage for this transient data
      localStorage.setItem('selectedEventForGroupReg', JSON.stringify({ eventId, eventName }));
      router.push('/dance-school/login');
    } catch (error) {
       toast({ title: "Error", description: "Could not save event selection. Please try again.", variant: "destructive"});
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 md:py-20 text-center">Loading Events...</div>;
  }

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20 space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Upcoming Events</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join us for our upcoming performances, workshops, and celebrations.
          </p>
        </section>

        <div className="p-4 bg-card rounded-lg shadow-md border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search by name, category, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
             <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                />
            </div>
             <Button onClick={() => { setSearchTerm(''); setDateFilter(''); }}>
                Clear Filters
            </Button>
          </div>
        </div>

        <section>
          {filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{event.eventTitle}</CardTitle>
                    <CardDescription className="font-semibold">{event.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-sm text-foreground/80 pt-2">{event.description}</p>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-3 pt-4">
                     <Button asChild>
                       <Link href={`/register?eventId=${event.id}&eventName=${encodeURIComponent(event.eventTitle)}`}>Individual Register</Link>
                     </Button>
                     <Button variant="secondary" onClick={() => handleGroupRegisterClick(event.id, event.eventTitle)}>
                        Group Register
                     </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-lg border-dashed border-2 border-border">
              <h3 className="text-xl font-semibold text-muted-foreground">No Events Open for Registration</h3>
              <p className="text-foreground/60 mt-2">Please check back later or clear your filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
