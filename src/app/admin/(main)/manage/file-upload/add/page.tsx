
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addFileUploadItem } from '../actions';

export default function AddFileUploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        setImagePreviewUrl(null);
        if(e.target) e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const imageFile = formData.get('imageFile') as File;

    if (!imageFile || imageFile.size === 0) {
      toast({ title: "Missing Image", description: "Please select an image to upload.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const result = await addFileUploadItem(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      router.push('/admin/manage/file-upload');
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/manage/file-upload"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New File Item</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New File Item Details</CardTitle>
          <CardDescription>
            Provide the title, image, and sort order for the new file item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">File Title <span className="text-destructive">*</span></Label>
              <Input
                id="fileTitle"
                name="fileTitle"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order <span className="text-destructive">*</span></Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={0}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageFile">Image <span className="text-destructive">*</span></Label>
              <Input
                id="imageFile"
                name="imageFile"
                type="file"
                onChange={handleImageChange}
                required
                accept="image/*"
              />
              {imagePreviewUrl && (
                <div className="mt-4 border border-border rounded-md p-2 inline-block">
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
                Add Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
