
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function ContactForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formKey, setFormKey] = useState(Date.now());

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: "Message Sent!",
                description: "Thank you for contacting us. We will get back to you shortly.",
            });
            setFormKey(Date.now());
        }, 1500);
    };

    return (
        <Card key={formKey}>
            <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label htmlFor="firstname">First Name</Label><Input id="firstname" name="firstname" placeholder="Please enter your first name" /></div>
                        <div className="space-y-2"><Label htmlFor="lastname">Last Name</Label><Input id="lastname" name="lastname" placeholder="Please enter your last name" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="Please enter your email address" /></div>
                    <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" placeholder="Enter the subject message" /></div>
                    <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" placeholder="Your message" rows={5} /></div>
                    <div className="p-4 border rounded-md bg-muted/50 text-center text-sm text-muted-foreground">reCAPTCHA Placeholder</div>
                    <div><Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send</Button></div>
                </form>
            </CardContent>
        </Card>
    );
}
