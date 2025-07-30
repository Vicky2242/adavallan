

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Download, Loader2, Frown, Printer, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import Barcode from 'react-barcode';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { type Event } from '@/lib/initial-data';
import { Label } from '@/components/ui/label';

// Interfaces matching the structure in Firestore
interface IndividualApplicant {
  id: string; 
  participantId: string;
  applicantName?: string;
  participantName?: string;
  email: string;
  phone?: string; 
  phoneNumber?: string;
  createdAt?: any;
  orderId?: string; 
  paidAmount?: string; 
  paidOn?: string; 
  dateOfBirth?: string;
  gender?: string;
  danceSchoolName?: string;
  danceTeacher?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  photoLink?: string; // This will now be a URL from Firebase Storage
  eventId?: string;
}

interface GroupParticipant {
  id: string; 
  groupId: string;
  participantId: string; 
  participantName: string;
  dateOfBirth: string; 
  gender: "male" | "female" | "other";
  phoneNumber: string;
  email: string;
  photoLink?: string;
}

interface GroupData {
  id: string; 
  groupName: string;
  danceSchoolId: string;
  studentCount: number;
  createdAt: any;
  eventId?: string;
}

interface DanceSchoolData {
  id: string;
  danceSchoolName: string;
  danceTeacherName: string;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
}

interface GroupPaymentData {
  id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  status: 'successful' | string;
  paidAmount: number;
  currency: string;
  paidOn: string;
  groupId: string;
}

interface CombinedParticipantDetails {
    participantId: string;
    name: string;
    email: string;
    phone: string;
    registrationDate: string;
    orderId: string;
    paidAmount: string;
    photoUrl: string;
    category: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    eventVenue?: string;
    dateOfBirth?: string;
    danceSchoolName?: string;
    danceTeacher?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
}

const TicketSection = ({ participant, type }: { participant: CombinedParticipantDetails, type: 'in' | 'out' }) => {
    const inTimeSignatures = [{ label: "Director's Signature" }, { label: "Participant's Signature" }];
    const outTimeSignatures = [{ label: "Thumb Impression" }, { label: "Candidate's Signature during the exam" }, { label: "Invigilator's Signature" }];
    const signatureFields = type === 'in' ? inTimeSignatures : outTimeSignatures;

    return (
        <div className="border-2 border-black p-4">
            <div className="text-center mb-4"><h3 className="font-bold text-xl border-y-2 border-black py-1">TICKET / REGISTERED INFO</h3><p className="font-semibold mt-1">WORLD RECORD ATTEMPT - 2024</p></div>
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 pr-2 space-y-1">
                  <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Participant ID:</span><span className="text-xs col-span-2">{participant.participantId}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Name:</span><span className="text-xs col-span-2">{participant.name}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Date of Birth:</span><span className="text-xs col-span-2">{participant.dateOfBirth || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Email:</span><span className="text-xs col-span-2">{participant.email || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Phone:</span><span className="text-xs col-span-2">{participant.phone || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Dance School:</span><span className="text-xs col-span-2">{participant.danceSchoolName || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Dance Teacher:</span><span className="text-xs col-span-2">{participant.danceTeacher || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Address:</span><span className="text-xs col-span-2">{participant.address || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">District/State:</span><span className="text-xs col-span-2">{`${participant.district || ''}${participant.district && participant.state ? ', ' : ''}${participant.state || ''}`}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Country:</span><span className="text-xs col-span-2">{participant.country || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Reg. Date:</span><span className="text-xs col-span-2">{participant.registrationDate}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Order ID:</span><span className="text-xs col-span-2 break-all">{participant.orderId || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Paid Amount:</span><span className="text-xs col-span-2">{participant.paidAmount || 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Event Schedule:</span><span className="text-xs col-span-2">{participant.eventDate && participant.eventTime ? `${participant.eventDate} @ ${participant.eventTime}` : 'N/A'}</span></div>
                   <div className="grid grid-cols-3 border-b py-1"><span className="font-semibold text-xs col-span-1">Venue:</span><span className="text-xs col-span-2">{participant.eventVenue || 'N/A'}</span></div>
                </div>
                 <div className="col-span-1 pl-2 space-y-2">
                     <div className="flex items-center justify-center h-40">
                         {participant.photoUrl ? (
                             <Image src={participant.photoUrl} alt="Participant Photo" width={100} height={120} className="object-cover border-2 border-black" data-ai-hint="portrait photo"/>
                         ) : (
                             <div className="w-[100px] h-[120px] border-2 border-black flex items-center justify-center bg-gray-200"><ImageIcon className="w-10 h-10 text-gray-500" /></div>
                         )}
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-1"><Barcode value={participant.participantId} height={40} fontSize={12} width={1} /></div>
                </div>
            </div>
            <div className={`grid grid-cols-${signatureFields.length} gap-4 mt-8 h-16`}>{signatureFields.map(field => (<div key={field.label} className="h-full flex flex-col justify-end items-center"><p className="text-xs border-t border-black w-full text-center pt-1">{field.label}</p></div>))}</div>
        </div>
    );
};
TicketSection.displayName = 'TicketSection';

const CertificateDisplay = React.forwardRef<HTMLDivElement, { participant: CombinedParticipantDetails }>(({ participant }, ref) => (
    <div ref={ref} className="p-4 bg-white text-black font-sans space-y-4">
        <TicketSection participant={participant} type="in" />
        <div className="border-t-2 border-dashed border-black my-4"></div>
        <TicketSection participant={participant} type="out" />
    </div>
));
CertificateDisplay.displayName = 'CertificateDisplay';

export default function CertificatePage() {
    const [participantId, setParticipantId] = useState('');
    const [dob, setDob] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [foundParticipant, setFoundParticipant] = useState<CombinedParticipantDetails | null>(null);
    const { toast } = useToast();
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleSearch = useCallback(async () => {
        if (!participantId.trim() || !dob.trim()) {
            toast({ title: 'Missing Information', description: "Please enter both Participant ID and Date of Birth.", variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        setFoundParticipant(null);

        if (firebaseInitializationError || !db) {
            toast({ title: "Database Error", description: "Cannot search. Firebase is not connected.", variant: "destructive"});
            setIsLoading(false);
            return;
        }

        try {
            const collections = {
                registrations: collection(db, "registrations"),
                groupParticipants: collection(db, "group_participants"),
                groups: collection(db, "groups"),
                groupPayments: collection(db, "group_payments"),
                danceSchools: collection(db, "dance-schools"),
                events: collection(db, "events"),
            };

            const [
                regSnap, groupPartSnap, groupsSnap, groupPaySnap, schoolsSnap, eventsSnap
            ] = await Promise.all([
                getDocs(query(collections.registrations)),
                getDocs(query(collections.groupParticipants)),
                getDocs(query(collections.groups)),
                getDocs(query(collections.groupPayments)),
                getDocs(query(collections.danceSchools)),
                getDocs(query(collections.events))
            ]);

            const individualRegs = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IndividualApplicant[];
            const groupParticipants = groupPartSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupParticipant[];
            const allGroups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupData[];
            const allGroupPayments = groupPaySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupPaymentData[];
            const allDanceSchools = schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DanceSchoolData[];
            const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
            
            let participant: CombinedParticipantDetails | null = null;
            const normalizedSearchTerm = participantId.trim();

            const individualMatch = individualRegs.find(p => p.participantId === normalizedSearchTerm && p.dateOfBirth === dob);
            if (individualMatch) {
                const event = allEvents.find(e => e.id === individualMatch.eventId);
                participant = {
                    participantId: individualMatch.participantId,
                    name: individualMatch.participantName || individualMatch.applicantName || 'N/A',
                    email: individualMatch.email,
                    phone: individualMatch.phoneNumber || individualMatch.phone || 'N/A',
                    registrationDate: individualMatch.createdAt?.toDate ? individualMatch.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A',
                    orderId: individualMatch.orderId || 'N/A',
                    paidAmount: individualMatch.paidAmount ? `Rs. ${individualMatch.paidAmount}` : 'N/A',
                    photoUrl: individualMatch.photoLink || '',
                    category: 'Individual Participant',
                    eventName: event?.eventTitle,
                    eventDate: event ? new Date(event.date).toLocaleDateString('en-GB') : 'N/A',
                    eventTime: event ? new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
                    eventVenue: event?.location,
                    dateOfBirth: individualMatch.dateOfBirth ? new Date(individualMatch.dateOfBirth).toLocaleDateString('en-GB') : 'N/A',
                    danceSchoolName: individualMatch.danceSchoolName,
                    danceTeacher: individualMatch.danceTeacher,
                    address: individualMatch.address,
                    city: individualMatch.city,
                    district: individualMatch.district,
                    state: individualMatch.state,
                    country: individualMatch.country,
                };
            } else {
                const groupParticipantMatch = groupParticipants.find(p => p.participantId === normalizedSearchTerm && p.dateOfBirth === dob);
                if (groupParticipantMatch) {
                    const group = allGroups.find(g => g.id === groupParticipantMatch.groupId);
                    const payment = allGroupPayments.find(p => p.groupId === groupParticipantMatch.groupId);
                    const school = group ? allDanceSchools.find(s => s.id === group.danceSchoolId) : undefined;
                    const event = group ? allEvents.find(e => e.id === group.eventId) : undefined;
                    
                    participant = {
                        participantId: groupParticipantMatch.participantId,
                        name: groupParticipantMatch.participantName,
                        email: groupParticipantMatch.email,
                        phone: groupParticipantMatch.phoneNumber,
                        registrationDate: group?.createdAt ? new Date(group.createdAt).toLocaleDateString('en-GB') : 'N/A',
                        orderId: payment?.razorpay_order_id || 'N/A',
                        paidAmount: payment ? `Rs. ${payment.paidAmount.toFixed(2)} (Group)` : 'N/A',
                        photoUrl: groupParticipantMatch.photoLink || '',
                        category: 'Group Participant',
                        eventName: event?.eventTitle,
                        eventDate: event ? new Date(event.date).toLocaleDateString('en-GB') : 'N/A',
                        eventTime: event ? new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
                        eventVenue: event?.location,
                        dateOfBirth: new Date(groupParticipantMatch.dateOfBirth).toLocaleDateString('en-GB'),
                        danceSchoolName: school?.danceSchoolName,
                        danceTeacher: school?.danceTeacherName,
                        address: school?.address,
                        city: school?.city,
                        district: school?.district,
                        state: school?.state,
                        country: school?.country,
                    };
                }
            }

            if (participant) {
                setFoundParticipant(participant);
            } else {
                toast({ title: 'Not Found', description: 'Invalid ID or Date of Birth. Please check your details and try again.', variant: 'destructive' });
            }

        } catch (error) {
            console.error("Error searching for participant:", error);
            toast({ title: 'Error', description: 'An error occurred while searching Firestore.', variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
     }, [participantId, dob, toast]);

     const handleDownloadPdf = () => {
        const certificateElement = certificateRef.current;
        if (!certificateElement || !foundParticipant) {
            toast({ title: "Error", description: "Cannot download, no certificate data.", variant: "destructive"});
            return;
        }
        
        html2canvas(certificateElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;
            let finalWidth, finalHeight;

            finalWidth = pdfWidth - 40;
            finalHeight = finalWidth / canvasAspectRatio;

            if (finalHeight > pdfHeight - 40) {
              finalHeight = pdfHeight - 40;
              finalWidth = finalHeight * canvasAspectRatio;
            }
            
            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(`Hall_Ticket_${foundParticipant.participantId}.pdf`);
        }).catch(err => {
            toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive"})
            console.error(err);
        });
    };

    return (
        <div className="container mx-auto flex flex-col items-center py-12 md:py-16">
            <Card className="w-full max-w-xl text-center space-y-4 shadow-lg no-print">
                <CardContent className="p-6">
                     <h1 className="text-2xl font-bold text-foreground md:text-3xl">Get Your Hall Ticket</h1>
                    <p className="text-muted-foreground">Enter your details below to download your hall ticket.</p>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2 text-left">
                           <Label htmlFor="participantId">Participant ID</Label>
                           <Input id="participantId" type="text" placeholder="Enter your Participant ID" value={participantId} onChange={(e) => setParticipantId(e.target.value)} />
                        </div>
                         <div className="space-y-2 text-left">
                           <Label htmlFor="dob">Date of Birth</Label>
                           <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                        </div>
                        <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Get Hall Ticket
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 w-full max-w-4xl">
                {isLoading && (<div className="text-center p-10 no-print"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><p className="mt-2 text-muted-foreground">Searching for participant...</p></div>)}
                {!isLoading && foundParticipant && (
                    <Card className="bg-card shadow-xl printable-area">
                       <CardContent className="p-4 sm:p-6">
                            <CertificateDisplay ref={certificateRef} participant={foundParticipant} />
                            <div className="mt-6 flex justify-center gap-4 no-print">
                               <Button onClick={handleDownloadPdf} variant="default"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                               <Button onClick={() => window.print()} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                            </div>
                       </CardContent>
                    </Card>
                )}
                 {!isLoading && !foundParticipant && (
                    <div className="text-center p-10 rounded-lg bg-muted/50 no-print">
                        <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Enter your details to generate your hall ticket.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
