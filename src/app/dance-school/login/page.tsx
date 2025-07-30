
'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { type DanceSchoolLoginState, loginDanceSchool } from './actions';
import { SubmitButton } from '@/components/submit-button';

const LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY = 'danceSchoolSession';

const initialState: DanceSchoolLoginState = {
  message: '',
  issues: [],
  success: false,
  fields: {
    email: '',
  }
};

export default function DanceSchoolLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = React.useActionState(loginDanceSchool, initialState);

  useEffect(() => {
    if (state?.message) {
      if (state.success && state.sessionData) {
        localStorage.setItem(LOCAL_STORAGE_DANCE_SCHOOL_SESSION_KEY, JSON.stringify(state.sessionData));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${state.sessionData.schoolName}!`,
        });
        formRef.current?.reset();
        router.push('/dance-school/dashboard');
      } else {
        toast({
          title: "Login Error",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast, router]);

  return (
    <main className="relative flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl rounded-lg bg-card border-border text-card-foreground">
          <CardHeader className="text-center p-6 sm:p-8">
            <CardTitle className="text-3xl font-headline font-bold text-accent">
              Dance School Login
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-1">
              Enter your credentials to access your school dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form ref={formRef} action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="school@example.com" 
                  required 
                  className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring" 
                  defaultValue={state?.fields?.email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  required 
                  className="bg-background border-input placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>
              
              {state?.message && !state.success && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}

              <SubmitButton className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-md">
                Login
              </SubmitButton>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/dance-school/register" className="font-medium text-accent hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
