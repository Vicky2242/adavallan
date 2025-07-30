
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Edit, Trash2, Eye, Printer, FileText, FileSpreadsheet, Loader2, Save, ShieldAlert, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query, writeBatch } from 'firebase/firestore';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Applicant {
  id: string; // Firestore document ID
  participantId: string;
  participantName: string; 
  fatherName?: string;
  email: string;
  phoneNumber: string; 
  registrationDate: string; 
  orderId?: string; 
  paidAmount?: string; 
  paidOn?: string; 
  dateOfBirth?: string;
  gender?: string;
  danceSchoolName?: string;
  danceTeacher?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  idProofLink?: string;
  photoLink?: string;
  createdAt?: any;
}

const ALL_COLUMNS = [
  { id: 'participantId', label: 'Participant ID'},
  { id: 'participantName', label: 'Applicant Name' },
  { id: 'email', label: 'Email' },
  { id: 'phoneNumber', label: 'Phone' },
  { id: 'action', label: 'Action' },
];

const EDITABLE_FIELDS: (keyof Applicant)[] = [
  'participantName', 'fatherName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 
  'danceSchoolName', 'danceTeacher', 'address', 'city', 'district', 'state', 'postalCode', 'country'
];


export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null);
  
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [applicantToView, setApplicantToView] = useState<Applicant | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [applicantToEdit, setApplicantToEdit] = useState<Applicant | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Applicant>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchApplicantsFromFirestore = useCallback(async () => {
    setIsLoading(true);
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Could not connect to Firestore.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    try {
      const registrationsCollection = collection(db, "registrations");
      const q = query(registrationsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const applicantsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          participantId: data.participantId || 'N/A',
          participantName: data.participantName || 'N/A',
          fatherName: data.fatherName || 'N/A',
          email: data.email || 'N/A',
          phoneNumber: data.phoneNumber || 'N/A',
          registrationDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A',
          orderId: data.orderId || 'N/A',
          paidAmount: data.paidAmount || 'N/A',
          paidOn: data.paidOn ? new Date(data.paidOn).toLocaleDateString() : 'N/A',
          dateOfBirth: data.dateOfBirth || 'N/A',
          gender: data.gender || 'N/A',
          danceSchoolName: data.danceSchoolName || 'N/A',
          danceTeacher: data.danceTeacher || 'N/A',
          address: data.address || 'N/A',
          city: data.city || 'N/A',
          district: data.district || 'N/A',
          state: data.state || 'N/A',
          postalCode: data.postalCode || 'N/A',
          country: data.country || 'N/A',
          photoLink: data.photoLink, // URL to the image
          idProofLink: data.idProofLink, // URL to the ID proof
          createdAt: data.createdAt,
        } as Applicant;
      });
      setApplicants(applicantsData);

    } catch (error) {
      console.error("Error fetching applicants from Firestore: ", error);
      toast({
        title: "Error Loading Applicants",
        description: "Could not load applicant data from Firestore.",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApplicantsFromFirestore();
  }, [fetchApplicantsFromFirestore]);
  

  const filteredApplicants = useMemo(() => applicants.filter(applicant =>
    Object.values(applicant).some(value =>
      value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [applicants, searchTerm]);

  const totalPages = useMemo(() => Math.ceil(filteredApplicants.length / rowsPerPage), [filteredApplicants.length, rowsPerPage]);
  
  const paginatedApplicants = useMemo(() => filteredApplicants.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ), [filteredApplicants, currentPage, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); 
  };
  
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };
  
  const handleEdit = useCallback((applicant: Applicant) => {
    setApplicantToEdit(applicant);
    setEditFormData({ ...applicant });
    setShowEditDialog(true);
  }, []);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = useCallback(async () => {
    if (!applicantToEdit || !editFormData || !db) return;
    setIsSavingEdit(true);

    try {
      const { id, createdAt, ...dataToUpdate } = editFormData;
      const docRef = doc(db, 'registrations', applicantToEdit.id);
      await updateDoc(docRef, dataToUpdate);

      toast({ title: "Applicant Updated", description: `Details for "${editFormData.participantName}" saved.` });
      fetchApplicantsFromFirestore(); // Refresh data
    } catch (error) {
      console.error("Error saving applicant edit to Firestore: ", error);
      toast({ title: "Error Updating Applicant", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
      setShowEditDialog(false);
      setApplicantToEdit(null);
    }
  }, [applicantToEdit, editFormData, toast, fetchApplicantsFromFirestore]);


  const handleDelete = useCallback((applicant: Applicant) => {
    setApplicantToDelete(applicant);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!applicantToDelete || !db) return;

    try {
      const docRef = doc(db, 'registrations', applicantToDelete.id);
      await deleteDoc(docRef);
      toast({ title: "Applicant Deleted", description: `Applicant "${applicantToDelete.participantName}" has been removed.` });
      fetchApplicantsFromFirestore();
    } catch (error) {
      console.error("Error deleting applicant from Firestore: ", error);
      toast({ title: "Error Deleting Applicant", description: "Could not remove applicant data.", variant: "destructive" });
    } finally {
      setShowDeleteDialog(false);
      setApplicantToDelete(null);
    }
  }, [applicantToDelete, toast, fetchApplicantsFromFirestore]);

  const handleView = useCallback((applicant: Applicant) => {
    setApplicantToView(applicant);
    setShowViewDialog(true);
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  const handleExportExcel = useCallback(() => {
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const header = visibleColumns.map(col => col.label);
    const body = filteredApplicants.map(applicant => 
      visibleColumns.map(col => String(applicant[col.id as keyof Applicant] ?? 'N/A'))
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applicants");
    XLSX.writeFile(wb, "applicants_export.xlsx");
    toast({ title: "Export Success", description: "Applicants data exported to Excel."});
  }, [columnVisibility, filteredApplicants, toast]);

  const handleExportPdf = useCallback(() => {
    const doc = new jsPDF();
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const tableHeaders = visibleColumns.map(col => col.label);
    const tableData = filteredApplicants.map(applicant =>
      visibleColumns.map(col => String(applicant[col.id as keyof Applicant] ?? 'N/A'))
    );
    doc.autoTable({
      head: [tableHeaders], body: tableData, startY: 20, styles: { fontSize: 8 },
      headStyles: { fillColor: [205, 33, 34] }, margin: { top: 15 }
    });
    doc.text("Applicants List", 14, 10);
    doc.save("applicants_export.pdf");
    toast({ title: "Export Success", description: "Applicants data exported to PDF."});
  }, [columnVisibility, filteredApplicants, toast]);

  const handleDownloadApplicantPdf = useCallback((applicant: Applicant) => {
    const doc = new jsPDF();
    doc.text(`Applicant Details: ${applicant.participantName}`, 14, 20);
    
    const applicantData = [
      ['Participant ID', applicant.participantId],
      ['Applicant Name', applicant.participantName],
      ['Father\'s Name', applicant.fatherName || 'N/A'],
      ['Email', applicant.email],
      ['Phone', applicant.phoneNumber],
      ['Registration Date', applicant.registrationDate],
      ['Order ID', applicant.orderId || 'N/A'],
      ['Paid Amount', applicant.paidAmount || 'N/A'],
      ['Paid On', applicant.paidOn || 'N/A'],
      ['Date of Birth', applicant.dateOfBirth || 'N/A'],
      ['Gender', applicant.gender || 'N/A'],
      ['Dance School', applicant.danceSchoolName || 'N/A'],
      ['Dance Teacher', applicant.danceTeacher || 'N/A'],
      ['Address', applicant.address || 'N/A'],
      ['City', applicant.city || 'N/A'],
      ['District', applicant.district || 'N/A'],
      ['State', applicant.state || 'N/A'],
      ['Postal Code', applicant.postalCode || 'N/A'],
      ['Country', applicant.country || 'N/A'],
    ];

    doc.autoTable({
      startY: 30,
      head: [['Field', 'Value']],
      body: applicantData,
      theme: 'grid',
      headStyles: { fillColor: [76, 57, 239] }
    });

    doc.save(`Applicant_${applicant.participantName.replace(/\s+/g, '_')}_${applicant.participantId}.pdf`);
    toast({ title: "Download Started", description: `Downloading details for ${applicant.participantName}.`});
  }, [toast]);

  const handleClearAllApplicants = useCallback(async () => {
    if (!db) return;
    setIsClearingAll(true);
    try {
      const registrationsCollection = collection(db, "registrations");
      const querySnapshot = await getDocs(registrationsCollection);
      
      if (querySnapshot.empty) {
        toast({ title: "No Applicants", description: "There are no applicants to clear." });
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast({ title: "Success", description: `Cleared ${querySnapshot.size} individual applicants.` });
      fetchApplicantsFromFirestore();
    } catch (error) {
      console.error("Error clearing all applicants:", error);
      toast({ title: "Error", description: "Could not clear all applicants.", variant: "destructive" });
    } finally {
      setIsClearingAll(false);
      setShowClearAllDialog(false);
    }
  }, [toast, fetchApplicantsFromFirestore]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Individual Applicants</h1>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map(num => (
                <SelectItem key={num} value={String(num)}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPdf}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator/>
              {ALL_COLUMNS.filter(col => col.id !== 'action').map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={columnVisibility[column.id]}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({ ...prev, [column.id]: !!value }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            type="search"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-9 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                {ALL_COLUMNS.map(column => 
                  columnVisibility[column.id] && (
                    <TableHead key={column.id} className="text-muted-foreground px-4 py-3 whitespace-nowrap">{column.label}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApplicants.map((applicant) => (
                <TableRow key={applicant.id} className="hover:bg-muted/50">
                  {columnVisibility.participantId && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{applicant.participantId}</TableCell>}
                  {columnVisibility.participantName && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{applicant.participantName}</TableCell>}
                  {columnVisibility.email && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{applicant.email}</TableCell>}
                  {columnVisibility.phoneNumber && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{applicant.phoneNumber}</TableCell>}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8" onClick={() => handleEdit(applicant)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8" onClick={() => handleDelete(applicant)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-emerald-400 hover:text-emerald-300 h-8 w-8" onClick={() => handleView(applicant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400 h-8 w-8" onClick={() => handleDownloadApplicantPdf(applicant)} title="Download Details">
                           <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
               {paginatedApplicants.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">
                    No individual applicants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow text-sm text-muted-foreground">
        <div className="text-center sm:text-left">
         Showing {paginatedApplicants.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
          {Math.min(currentPage * rowsPerPage, filteredApplicants.length)} of {filteredApplicants.length} entries
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8"
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this applicant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the applicant
              "{applicantToDelete?.participantName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => { setShowDeleteDialog(false); setApplicantToDelete(null); }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Applicant Details: {applicantToView?.participantName}</DialogTitle>
          </DialogHeader>
          {applicantToView && (
            <div className="space-y-3 py-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {(Object.keys(applicantToView) as Array<keyof Applicant>)
                  .filter(key => !['id', 'createdAt', 'photoLink', 'idProofLink'].includes(key) && applicantToView[key])
                  .map(key => (
                  <React.Fragment key={key}>
                    <p className="font-semibold text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
                    <p className="text-foreground truncate">{String(applicantToView[key] || 'N/A')}</p>
                  </React.Fragment>
                ))}
              </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 border-t">
                  <div className='space-y-1'>
                     <p className="font-semibold text-muted-foreground">Photo</p>
                      {applicantToView.photoLink ? <a href={applicantToView.photoLink} target="_blank" rel="noopener noreferrer" className='text-primary hover:underline'>View Image</a> : <p>Not Provided</p>}
                  </div>
                   <div className='space-y-1'>
                     <p className="font-semibold text-muted-foreground">ID Proof</p>
                      {applicantToView.idProofLink ? <a href={applicantToView.idProofLink} target="_blank" rel="noopener noreferrer" className='text-primary hover:underline'>View Document</a> : <p>Not Provided</p>}
                  </div>
                </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setApplicantToEdit(null); 
            setEditFormData({});
          }
          setShowEditDialog(isOpen);
        }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Applicant: {applicantToEdit?.participantName}</DialogTitle>
            <DialogDescription>Modify the applicant's details below.</DialogDescription>
          </DialogHeader>
          {applicantToEdit && (
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {EDITABLE_FIELDS.map(fieldKey => (
                <div key={fieldKey} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={fieldKey} className="text-right text-muted-foreground capitalize">
                    {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    id={fieldKey}
                    name={fieldKey}
                    value={editFormData[fieldKey] || ''}
                    onChange={handleEditFormChange}
                    className="col-span-2"
                    type={fieldKey === 'dateOfBirth' ? 'date' : fieldKey === 'email' ? 'email' : fieldKey === 'phoneNumber' ? 'tel' : 'text'}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
