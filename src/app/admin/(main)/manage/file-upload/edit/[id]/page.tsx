
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type FileUploadItem } from '../page';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateFileUploadItem } from '../actions';

export default function EditFileUploadPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const { toast } = useToast();

  const [itemData, setItemData] = useState<FileUploadItem | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!itemId) return;
    setIsLoading(true);

    if (firebaseInitializationError || !db) {
      toast({ title: "Firebase Error", description: "Cannot load data.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const fetchItem = async () => {
      const docRef = doc(db, 'fileUploads', itemId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as FileUploadItem;
          setItemData(data);
          setImagePreviewUrl(data.imageUrl);
        } else {
          toast({ title: "Error", description: "File item not found.", variant: "destructive" });
          router.push('/admin/manage/file-upload');
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch file item.", variant: "destructive" });
        console.error("Error fetching file item:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || !itemData) return;

    const formData = new FormData(formRef.current);
    formData.append('itemId', itemData.id);
    formData.append('currentImageUrl', itemData.imageUrl);
    
    setIsSubmitting(true);
    const result = await updateFileUploadItem(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      router.push('/admin/manage/file-upload');
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  if (isLoading || !itemData) {
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
          <Link href="/admin/manage/file-upload"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit File Item</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">File Item Details</CardTitle>
          <CardDescription>
            Modify information for: "{itemData.fileTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">File Title <span className="text-destructive">*</span></Label>
              <Input
                id="fileTitle"
                name="fileTitle"
                defaultValue={itemData.fileTitle}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order <span className="text-destructive">*</span></Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={itemData.sortOrder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageFile">Change Image (Optional)</Label>
              <Input
                id="imageFile"
                name="imageFile"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
              {imagePreviewUrl && (
                <div className="mt-4 border border-border rounded-md p-2 inline-block">
                  <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                  <Image src={imagePreviewUrl} alt="Image preview" width={200} height={120} className="rounded object-contain" />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button asChild type="button" variant="outline">
                 <Link href="/admin/manage/file-upload">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
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
