
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { submitDanceSchoolRegistration, type FormState } from './actions';
import { SubmitButton } from '@/components/submit-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countriesWithStates, type State, type District } from '@/lib/location-data';
import Image from 'next/image';


const initialState: FormState = {
  message: '',
  success: false,
  fields: {},
  issues: [],
};

export default function DanceSchoolRegisterPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = React.useActionState(submitDanceSchoolRegistration, initialState);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Registration Submitted", description: state.message });
        formRef.current?.reset();
      } else {
        toast({
          title: "Registration Error",
          description: state.issues?.join('\\n') || state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast]);

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const country = countriesWithStates.find(c => c.name === countryName);
    setAvailableStates(country?.states || []);
    setAvailableDistricts([]); // Reset districts when country changes
    const stateInput = formRef.current?.elements.namedItem('state') as HTMLInputElement | null;
    if(stateInput) stateInput.value = '';
    const districtInput = formRef.current?.elements.namedItem('district') as HTMLInputElement | null;
    if(districtInput) districtInput.value = '';
  };
  
  const handleStateChange = (stateName: string) => {
    const country = countriesWithStates.find(c => c.name === selectedCountry);
    const state = country?.states.find(s => s.name === stateName);
    setAvailableDistricts(state?.districts || []);
    const districtInput = formRef.current?.elements.namedItem('district') as HTMLInputElement | null;
    if(districtInput) districtInput.value = '';
  };
  
  return (
    <main className="relative flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl rounded-lg bg-card border-border text-card-foreground">
          <div className="flex flex-col items-center justify-center pt-8">
              <Image src="/LOGO.png" alt="Logo" width={150} height={150} data-ai-hint="company logo"/>
               <div className="text-center mt-4">
                <p className="text-lg font-semibold text-foreground">உலகம் முழுதும் பரதம்</p>
                <p className="text-md text-muted-foreground">பரத மாநாடு 2025</p>
              </div>
          </div>
          <CardHeader className="text-center p-6 sm:p-8">
            <CardTitle className="text-3xl font-headline font-bold text-accent">
              Dance School Registration
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-1">
              Register your dance school to manage group participations. Fields marked with <span className="text-destructive">*</span> are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form ref={formRef} action={formAction} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="danceSchoolName" className="text-muted-foreground">Dance School Name <span className="text-destructive">*</span></Label>
                <Input id="danceSchoolName" name="danceSchoolName" type="text" placeholder="e.g., Rhythm Steps Academy" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.danceSchoolName}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="danceTeacherName" className="text-muted-foreground">Dance Teacher Name <span className="text-destructive">*</span></Label>
                <Input id="danceTeacherName" name="danceTeacherName" type="text" placeholder="e.g., Ms. Priya Sharma" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.danceTeacherName}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-muted-foreground">Phone Number <span className="text-destructive">*</span></Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+91 98765 43210" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.phoneNumber}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email Address <span className="text-destructive">*</span></Label>
                  <Input id="email" name="email" type="email" placeholder="school@example.com" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.email}/>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-muted-foreground">Street Address <span className="text-destructive">*</span></Label>
                <Textarea id="address" name="address" placeholder="123 Dance Avenue, Main Street" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.address}/>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                  <Select name="country" required onValueChange={handleCountryChange}>
                    <SelectTrigger id="country"><SelectValue placeholder="Select Country"/></SelectTrigger>
                    <SelectContent>
                      {countriesWithStates.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                  <Select name="state" required onValueChange={handleStateChange} disabled={availableStates.length === 0}>
                    <SelectTrigger id="state"><SelectValue placeholder="Select State"/></SelectTrigger>
                    <SelectContent>
                      {availableStates.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="district">City/District <span className="text-destructive">*</span></Label>
                  <Select name="district" required disabled={availableDistricts.length === 0}>
                    <SelectTrigger id="district"><SelectValue placeholder="Select District"/></SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-muted-foreground">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" type="text" placeholder="e.g., 600001" className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" defaultValue={state.fields?.postalCode}/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <Input id="password" name="password" type="password" placeholder="Choose a strong password" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter password" required className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" />
                </div>
              </div>
              
               {state.message && !state.success && (
                <p className="text-sm text-destructive">{state.issues?.join(', ') || state.message}</p>
              )}
              
              <SubmitButton className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-md">
                Register School
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
