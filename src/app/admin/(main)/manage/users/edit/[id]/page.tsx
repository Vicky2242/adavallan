
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '../../page'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();

  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    if(firebaseInitializationError || !db) {
        toast({ title: "Firebase Error", description: "Cannot load data.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const fetchItem = async () => {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as User;
            setUserData(data);
            setFormData({
              name: data.name,
              email: data.email,
              userType: data.userType,
              status: data.status,
            });
        } else {
            toast({ title: "Error", description: "User not found.", variant: "destructive" });
            router.push('/admin/manage/users');
        }
        setIsLoading(false);
    };

    fetchItem();
  }, [userId, router, toast]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'userType' | 'status', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as User['userType'] | User['status'] }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.userType || !formData.status) {
        toast({ title: "Missing Fields", description: "Please fill in all required user details.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
     if (newPassword && newPassword.length < 8) {
      toast({ title: "Password Too Short", description: "New password must be at least 8 characters.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    const dataToUpdate: Partial<User> = { ...formData };
    if (newPassword) {
      dataToUpdate.password = newPassword;
    }
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, dataToUpdate);
      toast({ title: "Success", description: "User updated successfully." });
      router.push('/admin/manage/users');
    } catch (error) {
       toast({ title: "Error", description: "Failed to save updated user data.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || !userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/users"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">User Details</CardTitle>
          <CardDescription>
            Modify the information for user: "{userData.name}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                readOnly
                disabled
                className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="userType">User Type <span className="text-destructive">*</span></Label>
                    <Select value={formData.userType || ''} onValueChange={(val) => handleSelectChange('userType', val)}>
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
                 <div className="space-y-2">
                    <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                    <Select value={formData.status || ''} onValueChange={(val) => handleSelectChange('status', val)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <Card className="bg-muted/50 border-border p-4">
                <CardTitle className="text-md mb-3">Change Password (Optional)</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Re-enter new password"
                        />
                    </div>
                </div>
            </Card>


            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/manage/users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
