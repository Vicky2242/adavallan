
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Home, Loader2, Settings } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type ContentPage } from '@/lib/initial-data';
import { Badge } from '@/components/ui/badge';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';


export default function ContentPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<ContentPage | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const fetchPages = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const pagesCollection = collection(db, "pages");
        const q = query(pagesCollection, orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const pagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContentPage[];
        setPages(pagesData);
    } catch (error) {
        console.error("Error fetching pages from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch pages from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const sortedPages = useMemo(() => {
    return pages.filter(p => p.slug !== 'header-content' && p.slug !== 'footer-content');
  }, [pages]);

  const handleDeleteClick = (page: ContentPage) => {
    if (page.isHomepage) {
      toast({ title: "Action Denied", description: "You cannot delete the active homepage.", variant: "destructive" });
      return;
    }
    if (['home', 'about', 'services', 'awards', 'gallery', 'contact', 'header-content', 'footer-content'].includes(page.slug)) {
      toast({ title: "Action Denied", description: `The page with slug "${page.slug}" is a core system page and cannot be deleted.`, variant: "destructive" });
      return;
    }
    setPageToDelete(page);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!pageToDelete || !db) return;
    
    try {
      await deleteDoc(doc(db, 'pages', pageToDelete.id));
      toast({ title: "Page Deleted", description: `Page "${pageToDelete.title}" has been successfully removed.` });
      fetchPages(); // Refetch pages
    } catch (error) {
      console.error("Failed to delete page:", error);
      toast({ title: "Error", description: "Failed to delete page from Firestore.", variant: "destructive"});
    } finally {
      setShowDeleteDialog(false);
      setPageToDelete(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Content Pages</h1>
          <p className="text-muted-foreground mt-1">Manage the editable content pages of your public website.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button asChild className="w-full sm:w-auto">
                <Link href="/admin/settings">
                    <Settings className="mr-2 h-5 w-5" /> Header/Footer Settings
                </Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
              <Link href="/admin/site-pages/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Page
              </Link>
            </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPages.length > 0 ? (
                sortedPages.map((page) => (
                  <TableRow key={page.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium flex items-center gap-2">
                        {page.title}
                        {page.isHomepage && <Home className="h-4 w-4 text-primary" title="Homepage"/>}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">/ssc/{page.slug}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className={page.status === 'published' ? 'bg-green-600 text-white' : ''}>
                            {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : new Date(page.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <Button asChild variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8" title="Edit">
                           <Link href={`/admin/site-pages/edit/${page.id}`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 h-8 w-8" title="Delete" onClick={() => handleDeleteClick(page)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No pages found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the page
              "{pageToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
