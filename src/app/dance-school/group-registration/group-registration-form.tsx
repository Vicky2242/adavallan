
'use client';

import React, { useEffect, useRef, useState, useCallback, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitGroupAndStudentRegistration, type GroupRegistrationFormState } from './actions';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { type Event } from '@/lib/initial-data';


const GROUP_REG_FORM_DATA_KEY = 'groupRegistrationFormData';
const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';
const EVENT_FOR_REG_STORAGE_KEY = 'selectedEventForGroupReg';

const StudentClientSchema = z.object({
  participantName: z.string().min(1, { message: "Participant name is required." }),
  dateOfBirth: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Valid date of birth is required." }),
  gender: z.enum(["male", "female", "other"], { message: "Please select a gender." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format." }),
  email: z.string().email({ message: "Invalid email address." }),
  photoFile: z.instanceof(File).optional(),
  idProofFile: z.instanceof(File).optional(),
});

interface StudentFormData {
  id: string;
  participantName: string;
  dateOfBirth: string;
  selectedDate?: Date;
  gender: string;
  phoneNumber: string;
  email: string;
  photoFile?: File;
  idProofFile?: File;
}

const createEmptyStudent = (): StudentFormData => ({
  id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  participantName: '',
  dateOfBirth: '',
  selectedDate: undefined,
  gender: '',
  phoneNumber: '',
  email: '',
});

const initialState: GroupRegistrationFormState = {
  message: '',
  issues: [],
  success: false,
};

interface GroupRegistrationFormProps {
    openEvents: Event[];
}

export default function GroupRegistrationForm({ openEvents }: GroupRegistrationFormProps) {
  const [state, formAction] = React.useActionState(submitGroupAndStudentRegistration, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<StudentFormData[]>([createEmptyStudent()]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [danceSchoolId, setDanceSchoolId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<{id: string, name: string} | null>(null);

  const submissionProcessed = useRef(false);
  const initialLoadRef = useRef(true);

  // Load data from localStorage and fetch events
  useEffect(() => {
    const sessionDataString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    if (!sessionDataString) {
      toast({ title: "Not Logged In", description: "Please log in to register a group.", variant: "destructive" });
      router.push('/dance-school/login');
      return;
    }
    try {
      const parsedSession = JSON.parse(sessionDataString);
      setDanceSchoolId(parsedSession.schoolId);
    } catch (e) {
      toast({ title: "Session Error", variant: "destructive" });
      router.push('/dance-school/login');
      return;
    }

    const eventDataString = localStorage.getItem(EVENT_FOR_REG_STORAGE_KEY);
    if (eventDataString) {
        try {
            const eventData = JSON.parse(eventDataString);
            if (openEvents.some(e => e.id === eventData.eventId)) {
                setSelectedEvent({ id: eventData.eventId, name: eventData.eventName });
            } else {
                 toast({ title: "Event Not Available", description: "The previously selected event is no longer open for registration.", variant: "default" });
            }
        } catch (e) { console.error("Could not parse event data from localStorage", e); }
        finally {
            localStorage.removeItem(EVENT_FOR_REG_STORAGE_KEY);
        }
    }

    const savedData = localStorage.getItem(GROUP_REG_FORM_DATA_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setGroupName(parsedData.groupName || '');
        if (Array.isArray(parsedData.students) && parsedData.students.length > 0) {
           setStudents(
            parsedData.students.map((s: any) => ({
              ...createEmptyStudent(), 
              participantName: s.participantName,
              dateOfBirth: s.dateOfBirth,
              gender: s.gender,
              phoneNumber: s.phoneNumber,
              email: s.email,
              selectedDate: s.dateOfBirth ? parseISO(s.dateOfBirth) : undefined,
            }))
          );
        }
      } catch (error) { /* Fallback to default empty student is handled by useState initial value */ }
    }
    setIsLoaded(true);
  }, [router, toast, openEvents]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    const studentsToSave = students.map(({ photoFile, idProofFile, ...rest }) => rest);
    const dataToSave = { groupName, students: studentsToSave };
    localStorage.setItem(GROUP_REG_FORM_DATA_KEY, JSON.stringify(dataToSave));
  }, [groupName, students, isLoaded]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
  
    if (state?.success && state.groupId) {
      if (submissionProcessed.current) return;
      submissionProcessed.current = true;
      toast({ title: "Group Registered!", description: `Group "${groupName}" saved. Proceeding to payment.`, variant: "default" });
      localStorage.removeItem(GROUP_REG_FORM_DATA_KEY);
      router.push(`/dance-school/group-payment?groupId=${state.groupId}`);
    } else if (state && !state.success && state.message) {
      submissionProcessed.current = false;
      if (formRef.current) { 
        toast({ title: "Submission Error", description: state.issues?.join('\n') || state.message, variant: "destructive", duration: 7000 });
      }
    }
  }, [state, toast, router, groupName]);


  const handleAddStudent = () => setStudents([...students, createEmptyStudent()]);
  const handleRemoveStudent = useCallback((id: string) => setStudents(p => p.length <= 1 ? p : p.filter(s => s.id !== id)), []);
  const handleStudentChange = useCallback((id: string, field: keyof StudentFormData, value: string | File) => setStudents(p => p.map(s => s.id === id ? { ...s, [field]: value } : s)), []);
  const handleStudentDateChange = useCallback((id: string, date: Date | undefined) => setStudents(p => p.map(s => s.id === id ? { ...s, selectedDate: date, dateOfBirth: date ? format(date, "yyyy-MM-dd") : '' } : s)), []);
  const [openCalendars, setOpenCalendars] = useState<Record<string, boolean>>({});
  const toggleCalendar = useCallback((id: string) => setOpenCalendars(p => ({ ...p, [id]: !p[id] })), []);
  const [calendarConfig, setCalendarConfig] = useState<{ toYear: number; disabledFunc: (date: Date) => boolean } | null>(null);

  useEffect(() => {
    if (Object.values(openCalendars).some(isOpen => isOpen) && !calendarConfig) {
      const now = new Date();
      setCalendarConfig({ toYear: now.getFullYear(), disabledFunc: (date: Date) => date > now || date < new Date("1900-01-01") });
    }
  }, [openCalendars, calendarConfig]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, studentId: string, fileType: 'idProofFile' | 'photoFile') => {
    const file = event.target.files?.[0];
    if (file) {
      handleStudentChange(studentId, fileType, file);
    } else {
      handleStudentChange(studentId, fileType, undefined as any); // Clear file
    }
  }, [handleStudentChange]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors([]);
    
    const errors: string[] = [];
    if (!groupName.trim()) errors.push("Group Name is required.");
    if (!selectedEvent) errors.push("An event must be selected.");
    students.forEach((s, i) => { 
        const { photoFile, idProofFile, ...dataToValidate } = s;
        if (!StudentClientSchema.safeParse(dataToValidate).success) {
            errors.push(`Please complete all required fields for Student ${i + 1}.`);
        }
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      toast({ title: "Missing Information", description: <ul className="list-disc list-inside">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>, variant: "destructive", duration: 7000 });
      return;
    }
    
    const formData = new FormData(formRef.current!);
    const studentsForAction = students.map(({ id, selectedDate, ...rest }) => rest);
    formData.set('studentsDataString', JSON.stringify(studentsForAction));
    
    students.forEach((student, index) => {
      if (student.photoFile) formData.append(`student_${index}_photoFile`, student.photoFile);
      if (student.idProofFile) formData.append(`student_${index}_idProofFile`, student.idProofFile);
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleEventSelection = (eventId: string) => {
    const event = openEvents.find(e => e.id === eventId);
    if(event) {
        setSelectedEvent({ id: event.id, name: event.eventTitle });
    }
  };

  if (!danceSchoolId) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="ml-3 text-foreground">Loading registration form...</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-xl rounded-lg">
      <CardHeader className="text-center p-4 sm:p-6 md:p-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-10 w-10 text-accent mb-2"><path d="M17.6569 16.2427L19.0711 14.8285C19.8521 14.0475 20.1523 12.9514 19.9406 11.9073L19.0711 8.00005C18.8594 6.95598 18.1482 6.07182 17.1718 5.70634L13.7574 4.58584C12.781 4.22036 11.7091 4.42678 10.9289 5.20715L6.00005 10.1361L4.58584 11.5503L3.17162 12.9645L11.0001 20.7929L17.6569 16.2427Z"/><path d="M5.29289 18.7072L2 22.0001H8L11.0356 18.9645L6.70711 14.6361L5.29289 16.0503V18.7072Z"/><path d="M15.5356 8.05025L13.4142 5.92893L12 7.34314L14.1213 9.46446L15.5356 8.05025Z"/></svg>
        <CardTitle className="text-2xl sm:text-3xl font-headline font-bold text-accent">Group Registration</CardTitle>
        <CardDescription className="text-muted-foreground pt-1 text-sm sm:text-base">Fields marked with <span className="text-destructive">*</span> are required.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8">
        {!selectedEvent ? (
            <div className="space-y-4 text-center">
                 <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Select an Event</h3>
                <p className="text-muted-foreground">Please choose an event to register your group for.</p>
                 <Select onValueChange={handleEventSelection}>
                    <SelectTrigger className="w-full max-w-sm mx-auto">
                        <SelectValue placeholder="Choose an open event..." />
                    </SelectTrigger>
                    <SelectContent>
                        {openEvents.length > 0 ? (
                            openEvents.map(event => <SelectItem key={event.id} value={event.id}>{event.eventTitle}</SelectItem>)
                        ) : (
                             <SelectItem value="none" disabled>No events are currently open for registration.</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        ) : (
            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6 sm:space-y-8">
            <input type="hidden" name="danceSchoolId" value={danceSchoolId} />
            <input type="hidden" name="eventId" value={selectedEvent.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="eventName">Registering for Event</Label>
                <Input id="eventName" value={selectedEvent.name} readOnly disabled className="bg-muted/80"/>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="groupName">Group Name <span className="text-destructive">*</span></Label>
                <Input id="groupName" name="groupName" type="text" placeholder="e.g., Senior Champions" required value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">Student Details</h3>
            {students.map((student, index) => (
                <Card key={student.id} className="bg-muted/50 p-4 sm:p-5 space-y-4 relative">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-medium text-accent">Student {index + 1}</h4>
                    {students.length > 1 && (<Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveStudent(student.id)} className="h-7 w-7 sm:h-8 sm:w-8 absolute top-3 right-3"><Trash2 className="h-4 w-4" /><span className="sr-only">Remove</span></Button>)}
                </div>
                <div className="space-y-1.5"><Label htmlFor={`studentName_${student.id}`}>Participant Name <span className="text-destructive">*</span></Label><Input id={`studentName_${student.id}`} value={student.participantName} onChange={(e) => handleStudentChange(student.id, 'participantName', e.target.value)} required placeholder="Full Name" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Date of Birth <span className="text-destructive">*</span></Label><Popover open={!!openCalendars[student.id]} onOpenChange={() => toggleCalendar(student.id)}><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{student.selectedDate ? format(student.selectedDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0">{calendarConfig ? (<Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1900} toYear={calendarConfig.toYear} selected={student.selectedDate} onSelect={(d) => { handleStudentDateChange(student.id, d); toggleCalendar(student.id); }} disabled={calendarConfig.disabledFunc} initialFocus />) : <p>Loading calendar...</p>}</PopoverContent></Popover></div>
                    <div className="space-y-1.5"><Label>Gender <span className="text-destructive">*</span></Label><RadioGroup value={student.gender} onValueChange={(v) => handleStudentChange(student.id, 'gender', v)} className="flex space-x-4 pt-2">{['male', 'female', 'other'].map(g => (<div key={g} className="flex items-center space-x-2"><RadioGroupItem value={g} id={`${student.id}_${g}`} /><Label htmlFor={`${student.id}_${g}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</Label></div>))}</RadioGroup></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor={`phone_${student.id}`}>Phone Number <span className="text-destructive">*</span></Label><Input id={`phone_${student.id}`} value={student.phoneNumber} onChange={(e) => handleStudentChange(student.id, 'phoneNumber', e.target.value)} type="tel" required /></div>
                    <div className="space-y-1.5"><Label htmlFor={`email_${student.id}`}>Email <span className="text-destructive">*</span></Label><Input id={`email_${student.id}`} value={student.email} onChange={(e) => handleStudentChange(student.id, 'email', e.target.value)} type="email" required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>ID Proof (Optional)</Label><div className="flex items-center gap-2"><Input id={`idProofFile_${student.id}`} type="file" onChange={(e) => handleFileChange(e, student.id, 'idProofFile')} className="text-xs" accept=".pdf,image/jpeg,image/png,image/webp" /></div></div>
                    <div className="space-y-1.5"><Label>Photo (Optional)</Label><div className="flex items-center gap-2"><Input id={`photoFile_${student.id}`} type="file" onChange={(e) => handleFileChange(e, student.id, 'photoFile')} className="text-xs" accept="image/jpeg,image/png,image/gif,image/webp" /></div></div>
                </div>
                </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddStudent}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Add Another Student
            </Button>
            {formErrors.length > 0 && (<div className="rounded-md border border-destructive/50 p-3 bg-destructive/10 mt-4"><h3 className="text-sm font-medium text-destructive mb-1">Please correct errors:</h3><ul className="list-disc list-inside text-sm text-destructive space-y-1">{formErrors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>)}
            {state?.issues?.length && !state.success && (<div className="rounded-md border border-destructive/50 p-3 bg-destructive/10 mt-4"><h3 className="text-sm font-medium text-destructive mb-1">Server Validation Issues:</h3><ul className="list-disc list-inside text-sm text-destructive space-y-1">{state.issues.map((e, i) => <li key={i}>{e}</li>)}</ul></div>)}
            <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-2.5 sm:py-3 rounded-md mt-6">{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register Group &amp; Proceed to Payment</Button>
            </form>
        )}
      </CardContent>
    </Card>
  );
}
