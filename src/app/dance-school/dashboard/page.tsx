
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';

interface DanceSchoolSessionData {
  schoolId: string;
  schoolName: string;
  email: string;
}

export default function DanceSchoolDashboardPage() {
  const [schoolName, setSchoolName] = useState("Your Dance School"); 

  useEffect(() => {
    const sessionDataString = localStorage.getItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY);
    if (sessionDataString) {
      try {
        const parsedSession: DanceSchoolSessionData = JSON.parse(sessionDataString);
        setSchoolName(parsedSession.schoolName);
      } catch (e) {
        console.error("Failed to parse dance school session from localStorage on dashboard", e);
      }
    }
  }, []);


  return (
    <>
        <header className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Welcome, {schoolName}!
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your school profile and group registrations from here.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="items-center text-center p-8">
              <Settings className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Manage Profile</CardTitle>
              <CardDescription className="mt-2">
                Update your school&apos;s information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild className="w-full bg-primary hover:bg-primary/90" size="lg">
                <Link href="/dance-school/profile">
                  Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="items-center text-center p-8">
              <Users className="h-12 w-12 text-accent mb-4" />
              <CardTitle className="text-2xl">Student Groups</CardTitle>
              <CardDescription className="mt-2">
                Register new groups or manage existing ones for events.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                <Link href="/dance-school/group-registration">
                  Register New Group
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <footer className="pt-8 text-center text-sm text-muted-foreground">
          <a href="https://adavallan.com/index.php" target="_blank" className="hover:text-primary transition-colors">Adavallan Isaiyalayam</a> © {new Date().getFullYear()} All Rights Reserved. Powered by <a href="http://www.wezads.com" target="_blank" className="hover:text-primary transition-colors">WEZADS</a>
        </footer>
    </>
  );
}
