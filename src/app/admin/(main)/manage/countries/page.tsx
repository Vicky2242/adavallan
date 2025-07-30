
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Input } from "@/components/ui/input";
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
import { useRouter } from 'next/navigation';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

export interface Country {
  id: string;
  name: string;
}

const ALL_COLUMNS = [
  { id: 'name', label: 'Country Name' },
  { id: 'action', label: 'Action' },
];

export default function ManageCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);

  const fetchCountries = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const countriesCollection = collection(db, "countries");
        const q = query(countriesCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Country[];
        setCountries(data);
    } catch (error) {
        console.error("Error fetching countries from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch countries from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);


  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (countryId: string) => {
    router.push(`/admin/manage/countries/edit/${countryId}`);
  };

  const handleDeleteClick = (country: Country) => {
    setCountryToDelete(country);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!countryToDelete || !db) return;
    try {
        await deleteDoc(doc(db, "countries", countryToDelete.id));
        toast({ title: "Country Deleted", description: `"${countryToDelete.name}" has been removed.` });
        fetchCountries();
    } catch (e) {
        console.error("Error deleting country:", e);
        toast({ title: "Error", description: "Could not delete country.", variant: "destructive"});
    } finally {
        setShowDeleteDialog(false);
        setCountryToDelete(null);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-foreground" /><p className="ml-3 text-foreground">Loading countries...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage Countries</h1>
           <p className="text-muted-foreground mt-1">This list populates the country dropdown in registration forms.</p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
          <Link href="/admin/manage/countries/add"><PlusCircle className="mr-2 h-5 w-5" /> Add New</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input type="search" placeholder="Search countries..." value={searchTerm} onChange={handleSearchChange} className="h-9 w-full sm:w-64" />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="border-border hover:bg-muted/50">{ALL_COLUMNS.map(column => <TableHead key={column.id} className="text-muted-foreground px-4 py-3 whitespace-nowrap">{column.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {filteredCountries.map((country) => (
                <TableRow key={country.id} className="border-border hover:bg-muted/50">
                  <TableCell className="px-4 py-3 text-foreground whitespace-nowrap font-medium">{country.name}</TableCell>
                  <TableCell className="px-4 py-3 text-foreground whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8" onClick={() => handleEditClick(country.id)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 h-8 w-8" onClick={() => handleDeleteClick(country)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCountries.length === 0 && <TableRow className="border-border"><TableCell colSpan={ALL_COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground">No countries found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete "{countryToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setCountryToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
