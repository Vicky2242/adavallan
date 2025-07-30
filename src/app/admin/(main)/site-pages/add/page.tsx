
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ContentPage } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';


const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export default function AddContentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    slug: '',
    content: '',
    isHomepage: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'draft',
  });
  
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'error'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!isSlugManuallyEdited && formData.title) {
      setFormData(prev => ({ ...prev, slug: slugify(prev.title) }));
      setSlugStatus('idle'); setSlugMessage('');
    }
  }, [formData.title, isSlugManuallyEdited]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && !isSlugManuallyEdited) {
        setFormData(prev => ({ ...prev, slug: slugify(value) }));
        setSlugStatus('idle'); setSlugMessage('');
    }
    if (name === 'slug') {
        setIsSlugManuallyEdited(true);
        setSlugStatus('idle'); setSlugMessage('');
    }
  };
  
  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setFormData(prev => ({ ...prev, isHomepage: checked }));
    }
  };

  const handleStatusChange = (newStatus: 'draft' | 'published') => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const checkSlugUniqueness = useCallback(async () => {
    if (!formData.slug || !db) {
      setSlugStatus('idle'); setSlugMessage('');
      return;
    }
    setSlugStatus('checking'); setSlugMessage('');
    
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, where("slug", "==", formData.slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            setSlugStatus('unavailable'); setSlugMessage('This slug is already taken.');
        } else {
            setSlugStatus('available'); setSlugMessage('Slug is available.');
        }
    } catch (error) {
        console.error("Error checking slug uniqueness:", error);
        setSlugStatus('error'); setSlugMessage('Error checking slug.');
    }
  }, [formData.slug]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.slug && (isSlugManuallyEdited || formData.title)) { 
         checkSlugUniqueness();
      }
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [formData.slug, formData.title, isSlugManuallyEdited, checkSlugUniqueness]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot save page. Firebase is not configured correctly.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    
    const pagesCollection = collection(db, "pages");
    const q = query(pagesCollection, where("slug", "==", formData.slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setSlugStatus('unavailable');
      setSlugMessage('This slug is already taken.');
      toast({ title: "Slug Issue", description: "Slug is not available. Please choose a unique one.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }
    
    const newPage: Omit<ContentPage, 'id'> = {
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addDoc(pagesCollection, newPage);
      toast({ title: "Success", description: "New page added to Firestore successfully." });
      router.push('/admin/site-pages');
    } catch (error) {
      console.error("Failed to save new page to Firestore", error);
      toast({ title: "Error", description: "Could not save new page data to Firestore.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getSlugIcon = () => {
    switch (slugStatus) {
      case 'checking': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unavailable': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-foreground hover:bg-primary hover:text-primary-foreground" asChild>
          <Link href="/admin/site-pages"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Add New Page</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Page Details</CardTitle>
          <CardDescription>
            Fill in the information for your new content page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., About Our Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        onBlur={checkSlugUniqueness} 
                        required
                        placeholder="e.g., about-our-company"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {getSlugIcon()}
                    </div>
                </div>
                {slugMessage && <p className={`text-xs mt-1 ${slugStatus === 'available' ? 'text-green-400' : 'text-red-400'}`}>{slugMessage}</p>}
                 <p className="text-xs text-muted-foreground">URL: /ssc/<strong>{formData.slug || '{slug}'}</strong> (Auto-generated, can be edited. Must be unique.)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                className="min-h-[200px]"
                placeholder="Enter page content here. For core pages like Home/About/Services, this field should contain JSON. For other pages, it can be plain text/HTML."
              />
              <p className="text-xs text-yellow-400">Note: For dynamic pages like 'Home', this content must be valid JSON matching the expected structure.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHomepage"
                checked={formData.isHomepage}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="isHomepage">Set as Homepage</Label>
            </div>
             <p className="text-xs text-muted-foreground -mt-3 ml-6">If checked, this page will be set as the site's main homepage. Ensure server-side logic unsets other homepages.</p>


            <Card className="bg-muted/50 border-border">
                <CardHeader>
                    <CardTitle className="text-lg">SEO Settings (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                        <Input id="metaKeywords" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} placeholder="keyword1, keyword2, keyword3"/>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleStatusChange(value as 'draft' | 'published')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/site-pages')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || slugStatus === 'checking' || (slugStatus === 'unavailable' && !!formData.slug)} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Page
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
