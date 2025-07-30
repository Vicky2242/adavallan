
'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Event, type RegistrationType } from '@/lib/initial-data';
import { type RegistrationFormState, submitIndividualRegistration } from './actions';
import { SubmitButton } from '@/components/submit-button';
import { type Country as CountryData, type State as StateData, type District as DistrictData } from '@/lib/location-data';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const initialState: RegistrationFormState = {
  message: '',
  success: false,
};

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'];

interface RegistrationFormProps {
  openEvents: Event[];
  countriesData: CountryData[];
}

export default function RegistrationForm({ openEvents, countriesData }: RegistrationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = React.useActionState(submitIndividualRegistration, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRegType, setSelectedRegType] = useState<RegistrationType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<StateData[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<DistrictData[]>([]);
  const [selectedState, setSelectedState] = useState('');


  const [participationMode, setParticipationMode] = useState<'Online' | 'Offline'>('Online');
  const [totalPrice, setTotalPrice] = useState(1000);

  const [isPending, startTransition] = useTransition();
  const submissionProcessed = useRef(false);

  useEffect(() => {
    if (participationMode === 'Online') {
        setTotalPrice(1000);
    } else {
        setTotalPrice(1500);
    }
  }, [participationMode]);

  useEffect(() => {
    const eventIdFromUrl = searchParams.get('eventId');
    if (eventIdFromUrl) {
      const eventFromUrl = openEvents.find(e => e.id === eventIdFromUrl);
      if (eventFromUrl) {
          setSelectedEvent(eventFromUrl);
          if (eventFromUrl.registrationTypes.length > 0) {
            if (eventFromUrl.registrationTypes.length === 1) {
              setSelectedRegType(eventFromUrl.registrationTypes[0]);
            }
          } else {
             toast({ title: "Event Error", description: "This event has no registration types configured.", variant: "destructive" });
             router.push('/ssc/events');
          }
      } else {
          toast({ title: "Event Not Found or Not Open", description: "The pre-selected event is not available for registration.", variant: "destructive" });
      }
    }
  }, [searchParams, openEvents, toast, router]);

  useEffect(() => {
    if (!state || submissionProcessed.current) return;

    if (state.success && state.registrationId) {
      submissionProcessed.current = true;
      toast({ title: "Registration Submitted", description: "Proceeding to payment." });
      const price = selectedRegType?.price || totalPrice;
      router.push(`/payment?participantId=${state.registrationId}&amount=${price}`);
    } else if (!state.success && state.message) {
      submissionProcessed.current = false;
      toast({ title: "Submission Error", description: state.issues?.join('\\n') || state.message, variant: "destructive" });
    }
  }, [state, router, toast, selectedRegType, totalPrice]);
  
  const handleRegTypeChange = (regTypeId: string) => {
     if (selectedEvent) {
       const regType = selectedEvent.registrationTypes.find(rt => rt.id === regTypeId);
       setSelectedRegType(regType || null);
     }
  };

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const country = countriesData.find(c => c.name === countryName);
    setAvailableStates(country?.states || []);
    setAvailableDistricts([]);
    setSelectedState('');
    const stateInput = formRef.current?.elements.namedItem('state') as HTMLSelectElement | null;
    if(stateInput) stateInput.value = '';
     const districtInput = formRef.current?.elements.namedItem('district') as HTMLSelectElement | null;
    if(districtInput) districtInput.value = '';
  };
  
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const country = countriesData.find(c => c.name === selectedCountry);
    const state = country?.states.find(s => s.name === stateName);
    setAvailableDistricts(state?.districts || []);
    const districtInput = formRef.current?.elements.namedItem('district') as HTMLSelectElement | null;
    if(districtInput) districtInput.value = '';
  };

  const validateFile = (file: File | null | undefined): boolean => {
    if (!file || file.size === 0) {
      return true; 
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `File "${file.name}" is not a supported type. Please upload a valid image or PDF.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    submissionProcessed.current = false;

    const photoFile = photoInputRef.current?.files?.[0];
    const idProofFile = idProofInputRef.current?.files?.[0];
    
    if (!photoFile || photoFile.size === 0) {
      toast({ title: "Missing Photo", description: "Please upload a participant photo.", variant: "destructive"});
      return;
    }
    if (!idProofFile || idProofFile.size === 0) {
      toast({ title: "Missing ID Proof", description: "Please upload an ID proof document.", variant: "destructive"});
      return;
    }

    if (!validateFile(photoFile) || !validateFile(idProofFile)) {
      if (photoFile && !validateFile(photoFile) && photoInputRef.current) photoInputRef.current.value = "";
      if (idProofFile && !validateFile(idProofFile) && idProofInputRef.current) idProofInputRef.current.value = "";
      return; 
    }
    
    const formData = new FormData(formRef.current);
    
    if (photoFile) formData.set('photo', photoFile);
    if (idProofFile) formData.set('idProof', idProofFile);

    startTransition(() => {
        formAction(formData);
    });
  };

  return (
    <div className="relative flex flex-col items-center justify-start bg-background py-6 sm:py-8 px-4">
      <div className="w-full max-w-2xl">
        <Card className="w-full shadow-xl rounded-lg">
          <div className="flex flex-col items-center justify-center pt-8">
            <Image src="/LOGO.png" alt="Logo" width={150} height={150} data-ai-hint="company logo"/>
            <div className="text-center mt-4">
              <p className="text-lg font-semibold text-foreground">உலகம் முழுதும் பரதம்</p>
              <p className="text-md text-muted-foreground">பரத மாநாடு 2025</p>
            </div>
          </div>
          <CardHeader className="text-center p-4 sm:p-6 md:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-headline font-bold text-primary">Individual Registration</CardTitle>
            <CardDescription className="text-muted-foreground pt-1 text-sm sm:text-base">Fields with <span className="text-destructive">*</span> are required.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
              
              {selectedEvent && (
                 <input type="hidden" name="eventId" value={selectedEvent.id} />
              )}
               
              {selectedEvent && selectedEvent.registrationTypes.length > 1 && (
                <div className="space-y-2">
                    <Label htmlFor="registrationTypeId" className="text-foreground">Registration Type <span className="text-destructive">*</span></Label>
                    <Select name="registrationTypeId" onValueChange={handleRegTypeChange} required>
                       <SelectTrigger id="registrationTypeId" className="w-full"><SelectValue placeholder="Select registration type..." /></SelectTrigger>
                       <SelectContent>
                         {selectedEvent.registrationTypes.map(rt => (
                           <SelectItem key={rt.id} value={rt.id}>{rt.name ? `${rt.name} - ₹${rt.price}` : `₹${rt.price}`}</SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                </div>
              )}

              {selectedEvent && selectedEvent.registrationTypes.length === 1 && (
                <input type="hidden" name="registrationTypeId" value={selectedEvent.registrationTypes[0].id} />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="participantName">Participant Name <span className="text-destructive">*</span></Label><Input id="participantName" name="participantName" required /></div>
                <div className="space-y-1.5"><Label htmlFor="fatherName">Father's Name</Label><Input id="fatherName" name="fatherName" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Date of Birth <span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} fromYear={1920} toYear={new Date().getFullYear()} captionLayout="dropdown-buttons" initialFocus /></PopoverContent></Popover></div>
                <input type="hidden" name="dateOfBirth" value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} />
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                  <Select name="gender" required>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="phoneNumber">Phone <span className="text-destructive">*</span></Label><Input id="phoneNumber" name="phoneNumber" type="tel" required /></div>
                <div className="space-y-1.5"><Label htmlFor="email">Email <span className="text-destructive">*</span></Label><Input id="email" name="email" type="email" required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="danceSchoolName">Dance School <span className="text-destructive">*</span></Label><Input id="danceSchoolName" name="danceSchoolName" required /></div>
                <div className="space-y-1.5"><Label htmlFor="danceTeacher">Dance Teacher <span className="text-destructive">*</span></Label><Input id="danceTeacher" name="danceTeacher" required /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="address">Address <span className="text-destructive">*</span></Label><Textarea id="address" name="address" required /></div>
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                    <Select name="country" onValueChange={handleCountryChange} required>
                      <SelectTrigger id="country"><SelectValue placeholder="Select Country" /></SelectTrigger>
                      <SelectContent>
                        {countriesData.map(country => (
                          <SelectItem key={country.name} value={country.name}>{country.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Select name="state" required onValueChange={handleStateChange} disabled={availableStates.length === 0}>
                      <SelectTrigger id="state"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {availableStates.map(state => (
                          <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="district">City/District <span className="text-destructive">*</span></Label>
                    <Select name="district" required disabled={availableDistricts.length === 0}>
                      <SelectTrigger id="district"><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>
                        {availableDistricts.map(district => (
                          <SelectItem key={district.name} value={district.name}>{district.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1.5"><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" name="postalCode" /></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <Label htmlFor="idProof">ID Proof <span className="text-destructive">*</span></Label>
                      <Input ref={idProofInputRef} id="idProof" name="idProof" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required />
                  </div>
                   <div className="space-y-1.5">
                      <Label htmlFor="photo">Photo <span className="text-destructive">*</span></Label>
                      <Input ref={photoInputRef} id="photo" name="photo" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" required />
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="text-center">
                  <Label className="text-foreground font-semibold">Select Preferred Mode of Participation</Label>
                </div>
                <RadioGroup name="participationMode" value={participationMode} onValueChange={(value) => setParticipationMode(value as 'Online' | 'Offline')} className="flex items-center gap-4">
                    <Label
                      htmlFor="mode-online"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 cursor-pointer p-3 rounded-md border-2 transition-all",
                        participationMode === 'Online' ? 'bg-[#d11f22] text-white border-[#d11f22]' : 'bg-[#333] text-white border-transparent'
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", participationMode === 'Online' ? 'bg-white border-white' : 'border-white')}>
                        {participationMode === 'Online' && <div className="w-2 h-2 rounded-full bg-[#d11f22]"></div>}
                      </div>
                      <RadioGroupItem value="Online" id="mode-online" className="sr-only" />
                      Online - ₹1000
                    </Label>
                     <Label
                      htmlFor="mode-offline"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 cursor-pointer p-3 rounded-md border-2 transition-all",
                        participationMode === 'Offline' ? 'bg-[#d11f22] text-white border-[#d11f22]' : 'bg-[#333] text-white border-transparent'
                      )}
                    >
                       <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", participationMode === 'Offline' ? 'bg-white border-white' : 'border-white')}>
                        {participationMode === 'Offline' && <div className="w-2 h-2 rounded-full bg-[#d11f22]"></div>}
                      </div>
                      <RadioGroupItem value="Offline" id="mode-offline" className="sr-only"/>
                      Offline - ₹1500
                    </Label>
                </RadioGroup>
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Total Price: <span className="font-bold text-foreground">₹{totalPrice.toFixed(2)}</span></p>
                </div>
              </div>
              
              <SubmitButton pending={isPending} disabled={!selectedEvent} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3 rounded-md">
                Submit & Pay
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
