
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter
        import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type AdminLoginState, loginAdmin } from './actions';
import { SubmitButton } from '@/components/submit-button';

const initialState: AdminLoginState = {
  message: '',
  issues: [],
  success: false,
  fields: {
    email: '',
    password: ''
  }
};

export default function AdminLoginPage() {
  const [state, formAction] = React.useActionState(loginAdmin, initialState);
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: 'Login Success',
          description: state.message,
        });
        localStorage.setItem('adminLoggedIn', 'true'); // Set login flag
        formRef.current?.reset();
        router.push('/admin/dashboard'); // Client-side redirect
      } else {
        toast({
          title: 'Login Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-20 items-center bg-card px-6 shadow-md">
        <Image
          src="/admin-logo.png"
          alt="Sadhanai Sigaram Logo"
          width={150}
          height={150}
          className="object-contain"
          data-ai-hint="company logo"
        />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-card text-card-foreground shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Username</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="bg-background border-border text-foreground focus:ring-ring"
                  required
                  defaultValue={state?.fields?.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="bg-background border-border text-foreground focus:ring-ring"
                  required
                />
              </div>
              {state?.message && !state.success && state.issues && state.issues.length > 0 && (
                <div className="rounded-md border border-destructive/50 p-3 bg-destructive/10">
                  <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                    {state.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
               {state?.message && !state.success && (!state.issues || state.issues.length === 0) && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <SubmitButton className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3">
                Login
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground bg-card">
        <a href="https://adavallan.com/index.php" target="_blank" className="hover:text-primary transition-colors">Adavallan Isaiyalayam</a> © {new Date().getFullYear()} All Rights Reserved. Powered by <a href="http://www.wezads.com" target="_blank" className="hover:text-primary transition-colors">WEZADS</a>
      </footer>
    </div>
  );
}
