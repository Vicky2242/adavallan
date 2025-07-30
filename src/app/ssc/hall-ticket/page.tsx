

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, Loader2, Frown, Printer, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import Barcode from 'react-barcode';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { type Event } from '@/lib/initial-data';
import { Label } from '@/components/ui/label';

// Interfaces matching the structure in Firestore
interface IndividualApplicant {
  id: string; 
  participantId: string;
  applicantName?: string;
  participantName?: string;
  fatherName?: string;
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
  postalCode?: string;
  photoLink?: string; 
  eventId?: string;
  paymentStatus?: 'successful' | 'pending' | 'failed';
  participationMode?: 'Online' | 'Offline';
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
  paymentStatus?: 'paid' | 'pending' | 'failed';
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

interface CombinedParticipantDetails {
    participantId: string;
    name: string;
    fatherName: string;
    email: string;
    phone: string;
    photoUrl: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    institution: string;
    coordinator: string;
    paymentStatus: string;
    participationMode: string;
}

const CertificateDisplay = React.forwardRef<HTMLDivElement, { participant: CombinedParticipantDetails }>(({ participant }, ref) => (
    <div ref={ref} className="bg-white text-black font-sans p-4 sm:p-6 w-full max-w-4xl mx-auto">
        <div className="text-center mb-4 border-b-2 border-gray-300 pb-4">
            <div className="mx-auto mb-2 relative w-[200px] h-[200px]">
                <Image src="/LOGO.png" alt="Adavallan Isaiyalayam Logo" layout="fill" className="object-contain" data-ai-hint="company logo" />
            </div>
            <h1 className="text-2xl font-bold text-black tracking-wide">பரத மாநாடு 2025</h1>
            <p className="text-xl text-gray-700 font-semibold">Registration Confirmation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 space-y-2">
                <div className="grid grid-cols-3 border-b py-1.5"><span className="font-semibold text-black text-sm col-span-1">Registration ID</span><span className="text-sm col-span-2">{participant.participantId}</span></div>
                <div className="grid grid-cols-3 border-b py-1.5"><span className="font-semibold text-black text-sm col-span-1">Participant Name</span><span className="text-sm col-span-2">{participant.name}</span></div>
                <div className="grid grid-cols-3 border-b py-1.5"><span className="font-semibold text-black text-sm col-span-1">Father's Name</span><span className="text-sm col-span-2">{participant.fatherName}</span></div>
                <div className="grid grid-cols-3 border-b py-1.5"><span className="font-semibold text-black text-sm col-span-1">Gender</span><span className="text-sm col-span-2">{participant.gender}</span></div>
                <div className="grid grid-cols-3 py-1.5"><span className="font-semibold text-black text-sm col-span-1">Date of Birth</span><span className="text-sm col-span-2">{participant.dateOfBirth}</span></div>
            </div>
            <div className="md:col-span-1 flex flex-col items-center justify-center p-2 rounded-lg">
                 {participant.photoUrl ? (
                    <div className="w-[120px] h-[150px] relative mb-2">
                         <Image src={participant.photoUrl} alt="Participant Photo" layout="fill" className="object-cover border-2 border-gray-300 rounded" data-ai-hint="portrait photo"/>
                    </div>
                 ) : (
                    <div className="w-[120px] h-[150px] border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100 rounded mb-2"><ImageIcon className="w-12 h-12 text-gray-400" /></div>
                 )}
                <div className="mt-2">
                    <Barcode value={participant.participantId} height={40} fontSize={10} width={1.2} />
                </div>
            </div>
        </div>
        
        <div className="border-t-2 border-gray-300 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex border-b py-1.5"><p className="font-semibold text-black w-28 shrink-0">Email</p><p>{participant.email}</p></div>
                <div className="flex border-b py-1.5"><p className="font-semibold text-black w-28 shrink-0">Phone</p><p>{participant.phone}</p></div>
                <div className="md:col-span-2 flex border-b py-1.5"><p className="font-semibold text-black w-28 shrink-0">Address</p><p>{participant.address}</p></div>
                <div className="flex border-b py-1.5"><p className="font-semibold text-black w-28 shrink-0">Institution</p><p>{participant.institution}</p></div>
                <div className="flex border-b py-1.5"><p className="font-semibold text-black w-28 shrink-0">Coordinator</p><p>{participant.coordinator}</p></div>
                <div className="flex pt-1.5"><p className="font-semibold text-black w-28 shrink-0">Participation Mode</p><p>{participant.participationMode}</p></div>
                <div className="flex pt-1.5"><p className="font-semibold text-black w-28 shrink-0">Payment Status</p><p className="font-medium text-green-600">{participant.paymentStatus}</p></div>
            </div>
        </div>
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
            const normalizedSearchTerm = participantId.trim();
            let participant: CombinedParticipantDetails | null = null;
            let found = false;

            const individualRegsRef = collection(db, "registrations");
            const individualQuery = query(individualRegsRef, 
                where("participantId", "==", normalizedSearchTerm),
                where("dateOfBirth", "==", dob)
            );
            const individualSnap = await getDocs(individualQuery);
            
            if (!individualSnap.empty) {
                const individualMatch = { id: individualSnap.docs[0].id, ...individualSnap.docs[0].data() } as IndividualApplicant;
                participant = {
                    participantId: individualMatch.participantId,
                    name: individualMatch.participantName || individualMatch.applicantName || 'N/A',
                    fatherName: individualMatch.fatherName || 'N/A',
                    email: individualMatch.email,
                    phone: individualMatch.phoneNumber || individualMatch.phone || 'N/A',
                    photoUrl: individualMatch.photoLink || '',
                    dateOfBirth: individualMatch.dateOfBirth ? new Date(individualMatch.dateOfBirth).toLocaleDateString('en-GB') : 'N/A',
                    gender: individualMatch.gender ? individualMatch.gender.charAt(0).toUpperCase() + individualMatch.gender.slice(1) : 'N/A',
                    address: [individualMatch.address, individualMatch.city, individualMatch.state, individualMatch.country].filter(Boolean).join(', '),
                    institution: individualMatch.danceSchoolName || 'N/A',
                    coordinator: individualMatch.danceTeacher || 'N/A',
                    paymentStatus: individualMatch.paymentStatus ? individualMatch.paymentStatus.charAt(0).toUpperCase() + individualMatch.paymentStatus.slice(1) : 'Pending',
                    participationMode: individualMatch.participationMode || 'N/A',
                };
                found = true;
            }

            if (!found) {
                const groupPartsRef = collection(db, "group_participants");
                const groupPartQuery = query(groupPartsRef, 
                    where("participantId", "==", normalizedSearchTerm),
                    where("dateOfBirth", "==", dob)
                );
                const groupPartSnap = await getDocs(groupPartQuery);

                if (!groupPartSnap.empty) {
                    const groupParticipantMatch = { id: groupPartSnap.docs[0].id, ...groupPartSnap.docs[0].data() } as GroupParticipant;
                    
                    const groupsRef = collection(db, "groups");
                    const groupQuery = query(groupsRef, where("__name__", "==", groupParticipantMatch.groupId));
                    const groupsSnap = await getDocs(groupQuery);

                    const group = !groupsSnap.empty ? { id: groupsSnap.docs[0].id, ...groupsSnap.docs[0].data() } as GroupData : null;
                    const school = group ? await getDoc(doc(db, "dance-schools", group.danceSchoolId)) : null;
                    const schoolData = school?.exists() ? school.data() as DanceSchoolData : null;
                    
                    participant = {
                        participantId: groupParticipantMatch.participantId,
                        name: groupParticipantMatch.participantName,
                        fatherName: 'N/A',
                        email: groupParticipantMatch.email,
                        phone: groupParticipantMatch.phoneNumber,
                        photoUrl: groupParticipantMatch.photoLink || '',
                        dateOfBirth: new Date(groupParticipantMatch.dateOfBirth).toLocaleDateString('en-GB'),
                        gender: groupParticipantMatch.gender ? groupParticipantMatch.gender.charAt(0).toUpperCase() + groupParticipantMatch.gender.slice(1) : 'N/A',
                        address: [schoolData?.address, schoolData?.city, schoolData?.state, schoolData?.country].filter(Boolean).join(', '),
                        institution: schoolData?.danceSchoolName || 'N/A',
                        coordinator: schoolData?.danceTeacherName || 'N/A',
                        paymentStatus: group?.paymentStatus === 'paid' ? 'Successful' : 'Pending',
                        participationMode: 'Group',
                    };
                    found = true;
                }
            }
            
            if (found && participant) {
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
        
        html2canvas(certificateElement, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgAspectRatio = canvas.width / canvas.height;
            
            let finalWidth, finalHeight;

            if (pdfWidth / imgAspectRatio <= pdfHeight) {
                finalWidth = pdfWidth;
                finalHeight = pdfWidth / imgAspectRatio;
            } else {
                finalHeight = pdfHeight;
                finalWidth = pdfHeight * imgAspectRatio;
            }
    
            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(`Registration_Confirmation_${foundParticipant.participantId}.pdf`);
        }).catch(err => {
            toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive"})
            console.error(err);
        });
    };

    return (
        <div className="container mx-auto flex flex-col items-center py-12 md:py-16">
            <Card className="w-full max-w-xl text-center space-y-4 shadow-lg no-print bg-card">
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold text-foreground md:text-3xl">Get Your Hall Ticket</CardTitle>
                    <p className="text-muted-foreground">Enter your details below to download your hall ticket.</p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
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
                       <CardContent className="p-0 sm:p-0">
                            <CertificateDisplay ref={certificateRef} participant={foundParticipant} />
                            <div className="mt-6 flex justify-center gap-4 no-print pb-6">
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
