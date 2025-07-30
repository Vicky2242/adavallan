
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { Edit, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { type SliderItem } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { deleteSliderItem } from './actions';


const ALL_COLUMNS = [
  { id: 'sliderTitle', label: 'Slider Title' },
  { id: 'image', label: 'Image' },
  { id: 'sortOrder', label: 'Sort Order' },
  { id: 'action', label: 'Action' },
];

export default function ManageSliderPage() {
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SliderItem | null>(null);

  const fetchSliderItems = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const sliderCollection = collection(db, "sliders");
        const q = query(sliderCollection, orderBy("sortOrder", "asc"));
        const querySnapshot = await getDocs(q);
        const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SliderItem[];
        setSliderItems(itemsData);
    } catch (error) {
        console.error("Error fetching slider items from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch slider items from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSliderItems();
  }, [fetchSliderItems]);


  const handleDeleteClick = (item: SliderItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const result = await deleteSliderItem(itemToDelete.id, itemToDelete.imageUrl);

    if (result.success) {
      toast({
        title: "Slider Item Deleted",
        description: result.message,
      });
      fetchSliderItems(); 
    } else {
       toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading slider items from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Slider</h1>
        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
          <Link href="/admin/manage/slider/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Slide
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                {ALL_COLUMNS.map(column => 
                  <TableHead key={column.id} className="text-muted-foreground px-4 py-3 whitespace-nowrap">{column.label}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sliderItems.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-muted/50">
                  <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{item.sliderTitle}</TableCell>
                  <TableCell className="px-4 py-3">
                      <div className="relative h-16 w-32 rounded overflow-hidden">
                        <Image 
                          src={item.imageUrl} 
                          alt={item.sliderTitle} 
                          fill
                          className="object-cover"
                          data-ai-hint="slider image" 
                        />
                      </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-foreground text-center whitespace-nowrap">{item.sortOrder}</TableCell>
                  <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button asChild variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8">
                          <Link href={`/admin/manage/slider/edit/${item.id}`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 h-8 w-8" onClick={() => handleDeleteClick(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
               {sliderItems.length === 0 && !isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={ALL_COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground">
                    No slider items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this slider item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the slider
              "{itemToDelete?.sliderTitle}" and its image from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
