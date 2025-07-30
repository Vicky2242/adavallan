

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, LogIn } from 'lucide-react';

export default function DanceSchoolRegistrationSuccessPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-muted/40 p-6 animate-fade-in text-foreground">
      <Card className="w-full max-w-md text-center shadow-xl rounded-lg bg-card border-border">
        <CardHeader className="p-6 sm:p-8">
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline font-bold text-accent">
            School Registration Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <CardDescription className="text-lg text-muted-foreground mb-6">
            Your dance school has been registered. You can now log in to manage your profile and register student groups.
          </CardDescription>
          <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 mb-4">
            <Link href="/dance-school/login">Proceed to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
