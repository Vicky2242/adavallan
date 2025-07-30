
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Edit, Trash2, Printer, FileText, FileSpreadsheet, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from 'next/navigation';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DanceSchool {
  id: string; 
  danceSchoolName: string;
  danceTeacherName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  createdAt: any;
  password?: string;
}

const ALL_COLUMNS = [
  { id: 'danceSchoolName', label: 'School Name' },
  { id: 'danceTeacherName', label: 'Teacher Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'city', label: 'City' },
  { id: 'country', label: 'Country' },
  { id: 'createdAt', label: 'Registered On' },
  { id: 'action', label: 'Action' },
];

export default function ManageDanceSchoolsPage() {
  const [danceSchools, setDanceSchools] = useState<DanceSchool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const router = useRouter();

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<DanceSchool | null>(null);

  const fetchSchools = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const schoolsCollection = collection(db, "dance-schools");
        const q = query(schoolsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DanceSchool[];
        setDanceSchools(data);
    } catch (error) {
        console.error("Error fetching dance schools from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch dance schools from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);


  const filteredDanceSchools = danceSchools.filter(school =>
    Object.values(school).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredDanceSchools.length / rowsPerPage);
  const paginatedDanceSchools = filteredDanceSchools.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleEditClick = (schoolId: string) => {
    router.push(`/admin/manage/dance-schools/edit/${schoolId}`);
  };

  const handleDeleteClick = (school: DanceSchool) => {
    setSchoolToDelete(school);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!schoolToDelete || !db) return;
    try {
      await deleteDoc(doc(db, "dance-schools", schoolToDelete.id));
      toast({
        title: "Dance School Deleted",
        description: `"${schoolToDelete.danceSchoolName}" has been removed.`,
      });
      fetchSchools();
    } catch(e) {
      console.error("Error deleting school:", e);
      toast({ title: "Error", description: "Could not delete school.", variant: "destructive"});
    } finally {
      setShowDeleteDialog(false);
      setSchoolToDelete(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const header = visibleColumns.map(col => col.label);
    const body = filteredDanceSchools.map(item => 
      visibleColumns.map(col => String(item[col.id as keyof DanceSchool] ?? 'N/A'))
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanceSchools");
    XLSX.writeFile(wb, "dance_schools_export.xlsx");
    toast({ title: "Export Success", description: "Dance Schools data exported to Excel."});
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const tableHeaders = visibleColumns.map(col => col.label);
    const tableData = filteredDanceSchools.map(item =>
      visibleColumns.map(col => String(item[col.id as keyof DanceSchool] ?? 'N/A'))
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [205, 33, 34] }, 
      margin: { top: 15 }
    });
    doc.text("Dance Schools List", 14, 10);
    doc.save("dance_schools_export.pdf");
    toast({ title: "Export Success", description: "Dance Schools data exported to PDF."});
  };

  const formatDateFromTimestamp = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp && typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
    }
    return 'N/A';
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading dance schools...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Registered Dance Schools</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/manage/dance-schools/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New School
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[5,10,20,50].map(num => (
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
            placeholder="Search schools..."
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
              <TableRow className="border-border hover:bg-muted/50">
                {ALL_COLUMNS.map(column => 
                  columnVisibility[column.id] && (
                    <TableHead key={column.id} className="text-muted-foreground px-4 py-3 whitespace-nowrap">{column.label}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDanceSchools.map((school) => (
                <TableRow key={school.id} className="border-border hover:bg-muted/50">
                  {columnVisibility.danceSchoolName && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.danceSchoolName}</TableCell>}
                  {columnVisibility.danceTeacherName && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.danceTeacherName}</TableCell>}
                  {columnVisibility.email && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.email}</TableCell>}
                  {columnVisibility.phone && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.phone}</TableCell>}
                  {columnVisibility.city && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.city}</TableCell>}
                  {columnVisibility.country && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{school.country}</TableCell>}
                  {columnVisibility.createdAt && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{formatDateFromTimestamp(school.createdAt)}</TableCell>}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-[rgb(56_189_248)] hover:text-[rgb(56_189_248)]/90 h-8 w-8" title="Edit School" onClick={() => handleEditClick(school.id)}>
                           <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8" title="Delete School" onClick={() => handleDeleteClick(school)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
               {paginatedDanceSchools.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">
                    No dance schools found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow text-sm text-muted-foreground">
        <div className="text-center sm:text-left">
          Rows per page: {rowsPerPage}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span>Page {currentPage} of {totalPages}</span>
          <span className="hidden sm:inline px-2">|</span>
          <span>
            Showing {paginatedDanceSchools.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, filteredDanceSchools.length)} of {filteredDanceSchools.length} entries
          </span>
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
            <AlertDialogTitle>Are you sure you want to delete this school?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the school
              "{schoolToDelete?.danceSchoolName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setSchoolToDelete(null);
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
