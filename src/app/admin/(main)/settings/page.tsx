
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Save, UserCircle, Edit, Download, Upload, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ContentPage } from '@/lib/initial-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';


interface TimezoneOption {
  value: string;
  label: string;
}

const timezoneOptions: TimezoneOption[] = [
  { value: 'Etc/UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/New_York', label: 'US Eastern Time (ET, UTC-5/-4)' },
  { value: 'America/Chicago', label: 'US Central Time (CT, UTC-6/-5)' },
  { value: 'America/Denver', label: 'US Mountain Time (MT, UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'US Pacific Time (PT, UTC-8/-7)' },
  { value: 'Europe/London', label: 'London (GMT/BST, UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST, UTC+1/+2)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT, UTC+10/+11)' },
];

// localStorage Keys
const PLATFORM_TIMEZONE_KEY = 'adminPlatformTimezone';
const PROFILE_SETTINGS_KEY = 'adminProfileSettings';

interface ProfileSettingsData {
  firstName: string;
  lastName: string;
  email: string;
  profileImageDataUri: string | null;
}

const ALL_DATA_KEYS = [
    'adminAddonsData', 'adminCountriesData', 
    'adminCouponsData', 'adminDanceSchoolsData', 'adminFileUploadsData', 
    'adminSliderItemsData', 'adminUsersData',
    'allUserRegistrationsData', 'allUserPaymentsData', 'allDanceSchoolRegistrationsData',
    'allDanceSchoolGroupsData', 'allGroupParticipantsData', 'allGroupPaymentsData',
    'participantScanLogs', 'hallTicketScanLogs',
    'adminPlatformTimezone', 'adminProfileSettings',
    'danceSchoolSession', 'selectedEventForGroupReg', 'groupRegistrationFormData',
];


export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Platform Timezone State
  const [platformTimezone, setPlatformTimezone] = useState<string>('Asia/Kolkata');

  // Profile Settings State
  const [firstName, setFirstName] = useState('Head Office');
  const [lastName, setLastName] = useState('Admin');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [profileImageDataUri, setProfileImageDataUri] = useState<string | null>(null);
  const [profileImageName, setProfileImageName] = useState('No file Chosen');
  
  // New state for header/footer page IDs
  const [headerPageId, setHeaderPageId] = useState<string | null>(null);
  const [footerPageId, setFooterPageId] = useState<string | null>(null);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    // Load Platform Timezone
    const savedTimezone = localStorage.getItem(PLATFORM_TIMEZONE_KEY);
    if (savedTimezone) {
      setPlatformTimezone(savedTimezone);
    }

    // Load Profile Settings
    const savedProfileSettings = localStorage.getItem(PROFILE_SETTINGS_KEY);
    if (savedProfileSettings) {
      try {
        const parsed: ProfileSettingsData = JSON.parse(savedProfileSettings);
        setFirstName(parsed.firstName || 'Head Office');
        setLastName(parsed.lastName || 'Admin');
        setEmail(parsed.email || 'admin@example.com');
        setProfileImageDataUri(parsed.profileImageDataUri || null);
      } catch (e) { console.error("Failed to parse profile settings from localStorage", e); }
    }
  }, []);
  
  // Fetch Header/Footer IDs from Firestore
  useEffect(() => {
    const fetchPageIds = async () => {
      if (firebaseInitializationError || !db) {
          toast({ title: "Database Error", description: "Cannot load settings links from Firestore.", variant: "destructive" });
          setIsLoadingLinks(false);
          return;
      }
      setIsLoadingLinks(true);
      try {
          const pagesCollection = collection(db, "pages");
          const headerQuery = query(pagesCollection, where("slug", "==", "header-content"));
          const footerQuery = query(pagesCollection, where("slug", "==", "footer-content"));
          
          const [headerSnapshot, footerSnapshot] = await Promise.all([
              getDocs(headerQuery),
              getDocs(footerQuery)
          ]);

          if (!headerSnapshot.empty) {
              setHeaderPageId(headerSnapshot.docs[0].id);
          } else {
              console.warn("Header content page not found in Firestore.");
          }
          if (!footerSnapshot.empty) {
              setFooterPageId(footerSnapshot.docs[0].id);
          } else {
              console.warn("Footer content page not found in Firestore.");
          }

      } catch (e) {
          console.error("Failed to fetch page IDs from Firestore:", e);
          toast({ title: "Error", description: "Could not find header/footer config pages.", variant: "destructive" });
      } finally {
          setIsLoadingLinks(false);
      }
    };

    fetchPageIds();
  }, [toast]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        setProfileImageName('No file chosen');
        setProfileImageDataUri(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setProfileImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageName('No file Chosen');
      setProfileImageDataUri(null);
    }
  };

  const handleSubmitProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profileData: ProfileSettingsData = { firstName, lastName, email, profileImageDataUri };
    localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(profileData));
    // Password is not saved to localStorage for this demo. In a real app, it'd be handled securely.
    if (password) {
        toast({ title: "Profile Saved", description: "Profile settings (excluding password) updated. Password change simulated." });
        setPassword(''); // Clear password field after "submit"
    } else {
        toast({ title: "Profile Saved", description: "Profile settings updated." });
    }
  };

  const handleSavePlatformSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem(PLATFORM_TIMEZONE_KEY, platformTimezone);
    toast({ title: "Platform Settings Saved", description: `Timezone set to ${timezoneOptions.find(tz => tz.value === platformTimezone)?.label || platformTimezone}.` });
  };
  
  const handleBackup = () => {
    try {
        const backupData: Record<string, any> = {};
        ALL_DATA_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                backupData[key] = data; // Keep as string
            }
        });

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `ssc-backup-${date}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Backup Successful", description: "All application data has been downloaded." });
    } catch (error) {
        console.error("Backup failed", error);
        toast({ title: "Backup Failed", description: "Could not create backup file.", variant: "destructive" });
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("File content is not readable.");
            }
            const backupData = JSON.parse(text);

            // Clear existing keys before restoring
            ALL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
            
            // Restore data
            let restoredKeysCount = 0;
            Object.keys(backupData).forEach(key => {
                if (ALL_DATA_KEYS.includes(key)) {
                    localStorage.setItem(key, backupData[key]);
                    restoredKeysCount++;
                }
            });

            toast({ title: "Restore Successful", description: `Restored ${restoredKeysCount} data sets. The page will now reload.` });
            
            // Reload the page to apply restored settings
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("Restore failed", error);
            toast({ title: "Restore Failed", description: "The selected file is not a valid backup file.", variant: "destructive" });
        } finally {
            // Reset file input
            if(restoreFileInputRef.current) restoreFileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Header Settings</CardTitle>
                <CardDescription>Manage your site's logo, name, and navigation menu.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingLinks ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <Button asChild disabled={!headerPageId}>
                      <Link href={headerPageId ? `/admin/site-pages/edit/${headerPageId}` : '#'}>
                          <Edit className="mr-2 h-4 w-4"/>
                          {headerPageId ? 'Edit Header' : 'Header Page Not Found'}
                      </Link>
                  </Button>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>Manage all the content in your site's footer.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingLinks ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <Button asChild disabled={!footerPageId}>
                     <Link href={footerPageId ? `/admin/site-pages/edit/${footerPageId}` : '#'}>
                          <Edit className="mr-2 h-4 w-4"/>
                          {footerPageId ? 'Edit Footer' : 'Footer Page Not Found'}
                      </Link>
                  </Button>
                )}
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5"/>
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Download all application data from localStorage to a file or restore from a previous backup. This does not affect Firestore data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleBackup}>
            <Download className="mr-2 h-4 w-4" /> Backup All Data
          </Button>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Restore from Backup
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Restoring from a backup will permanently delete all current localStorage data and replace it with the data from your backup file.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => restoreFileInputRef.current?.click()}>
                  Yes, Restore Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <input
            type="file"
            ref={restoreFileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleRestore}
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Platform Timezone Settings</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm">
            Set the default timezone for displaying scheduled events.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSavePlatformSettings} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformTimezone" className="text-muted-foreground text-xs sm:text-sm">Default Platform Timezone</Label>
              <Select value={platformTimezone} onValueChange={setPlatformTimezone}>
                <SelectTrigger id="platformTimezone" className="bg-background border-input text-foreground text-xs sm:text-sm">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground max-h-60 text-xs sm:text-sm">
                  {timezoneOptions.map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value} 
                      className="hover:bg-accent focus:bg-accent"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current: {timezoneOptions.find(tz => tz.value === platformTimezone)?.label || platformTimezone}
              </p>
            </div>
            <div>
              <Button type="submit" className="font-semibold px-4 sm:px-6 py-2 text-xs sm:text-sm">
                <Save className="mr-2 h-4 w-4" /> Save Platform Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Profile Settings</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm">Please Fill Details Below:</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmitProfile} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs sm:text-sm">Profile Image</Label>
              <div className="flex items-center gap-4">
                {profileImageDataUri ? (
                  <Image src={profileImageDataUri} alt="Profile Preview" width={80} height={80} className="rounded-full object-cover border-2 border-border" data-ai-hint="user avatar" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border text-xs sm:text-sm py-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{profileImageName}</p>
                  <Input
                    id="profileImage"
                    name="profileImage"
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-muted-foreground text-xs sm:text-sm">Name</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="bg-background border-input text-foreground placeholder-muted-foreground flex-1 text-xs sm:text-sm"
                />
                <Input
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="bg-background border-input text-foreground placeholder-muted-foreground flex-1 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs sm:text-sm">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="bg-background border-input text-foreground placeholder-muted-foreground text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs sm:text-sm">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password or leave blank"
                className="bg-background border-input text-foreground placeholder-muted-foreground text-xs sm:text-sm"
              />
               <p className="text-xs text-muted-foreground">Leave blank to keep current password (if any).</p>
            </div>
            <div>
              <Button type="submit" className="font-semibold px-4 sm:px-6 py-2 text-xs sm:text-sm">
                <Save className="mr-2 h-4 w-4" /> Save Profile Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
