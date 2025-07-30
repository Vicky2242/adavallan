
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type User } from '../page';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';


export default function AddUserPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<User, 'id' | 'status'>>({
    name: '',
    email: '',
    userType: 'Staff',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (value: User['userType']) => {
    setFormData(prev => ({ ...prev, userType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured. Cannot save user.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (!formData.name || !formData.email || !formData.userType || !formData.password) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    if (formData.password !== confirmPassword) {
        toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    // Check if email already exists
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("email", "==", formData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        toast({ title: "Email Exists", description: "A user with this email already exists.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const newUser = {
      ...formData,
      status: 'Active',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(usersCollection, newUser);
      toast({ title: "Success", description: "New user added successfully." });
      router.push('/admin/manage/users');
    } catch (error) {
      console.error("Failed to save new user to Firestore", error);
      toast({ title: "Error", description: "Could not save new user data.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/users"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New User Details</CardTitle>
          <CardDescription>
            Fill in the information for the new user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., John Doe"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="e.g., user@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="userType">User Type <span className="text-destructive">*</span></Label>
                <Select value={formData.userType} onValueChange={handleUserTypeChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password || ''}
                        onChange={handleChange}
                        required
                        placeholder="Min. 8 characters"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Add User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
