
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

export interface Addon {
  id: string;
  title: string;
  amount: number;
  currency: string;
}

const ALL_COLUMNS = [
  { id: 'title', label: 'Title' },
  { id: 'amount', label: 'Amount' },
  { id: 'currency', label: 'Currency' },
  { id: 'action', label: 'Action' },
];

export default function ManageAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
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
  const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);
  
  const fetchAddons = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const addonsCollection = collection(db, "addons");
        const q = query(addonsCollection, orderBy("title", "asc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Addon[];
        setAddons(data);
    } catch (error) {
        console.error("Error fetching addons from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch addons from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);


  const filteredAddons = addons.filter(addon =>
    Object.values(addon).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredAddons.length / rowsPerPage);
  const paginatedAddons = filteredAddons.slice(
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

  const handleEditClick = (addonId: string) => {
    router.push(`/admin/manage/addons/edit/${addonId}`);
  };

  const handleDeleteClick = (addon: Addon) => {
    setAddonToDelete(addon);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!addonToDelete || !db) return;
    try {
        await deleteDoc(doc(db, "addons", addonToDelete.id));
        toast({ title: "Addon Deleted", description: `Addon "${addonToDelete.title}" has been removed.` });
        fetchAddons();
    } catch(e) {
        console.error("Error deleting addon:", e);
        toast({ title: "Error", description: "Could not delete the addon.", variant: "destructive"});
    } finally {
        setShowDeleteDialog(false);
        setAddonToDelete(null);
    }
  };

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const header = visibleColumns.map(col => col.label);
    const body = filteredAddons.map(item => 
      visibleColumns.map(col => String(item[col.id as keyof Addon] ?? 'N/A'))
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, "Addons");
    XLSX.writeFile(XLSX.utils.book_new(), "addons_export.xlsx");
    toast({ title: "Export Success", description: "Addons data exported to Excel."});
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const tableHeaders = visibleColumns.map(col => col.label);
    const tableData = filteredAddons.map(item =>
      visibleColumns.map(col => String(item[col.id as keyof Addon] ?? 'N/A'))
    );
    doc.autoTable({
      head: [tableHeaders], body: tableData, startY: 20, styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 152, 0] }, margin: { top: 15 }
    });
    doc.text("Addons List", 14, 10);
    doc.save("addons_export.pdf");
    toast({ title: "Export Success", description: "Addons data exported to PDF."});
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-foreground" /><p className="ml-3">Loading addons...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Addons</h1>
        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
          <Link href="/admin/manage/addons/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
            <SelectTrigger className="w-20 h-9"><SelectValue placeholder="Rows" /></SelectTrigger>
            <SelectContent>{[5, 10, 20, 50].map(num => <SelectItem key={num} value={String(num)}>{num}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9">Columns <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel><DropdownMenuSeparator />
              {ALL_COLUMNS.filter(col => col.id !== 'action').map((column) => (
                <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={columnVisibility[column.id]} onCheckedChange={(value) => setColumnVisibility((prev) => ({ ...prev, [column.id]: !!value }))}>{column.label}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input type="search" placeholder="Search addons..." value={searchTerm} onChange={handleSearchChange} className="h-9 w-full sm:w-64" />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="border-border hover:bg-muted/50">{ALL_COLUMNS.map(column => columnVisibility[column.id] && <TableHead key={column.id} className="text-muted-foreground px-4 py-3 whitespace-nowrap">{column.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {paginatedAddons.map((addon) => (
                <TableRow key={addon.id} className="border-border hover:bg-muted/50">
                  {columnVisibility.title && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{addon.title}</TableCell>}
                  {columnVisibility.amount && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{addon.amount}</TableCell>}
                  {columnVisibility.currency && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{addon.currency}</TableCell>}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8" onClick={() => handleEditClick(addon.id)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 h-8 w-8" onClick={() => handleDeleteClick(addon)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {paginatedAddons.length === 0 && <TableRow className="border-border"><TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">No addons found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow text-sm text-muted-foreground">
        <div>Rows per page: {rowsPerPage}</div>
        <div className="flex items-center gap-2">Page {currentPage} of {totalPages} <span className="hidden sm:inline px-2">|</span> Showing {paginatedAddons.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1: 0}-{Math.min(currentPage * rowsPerPage, filteredAddons.length)} of {filteredAddons.length}</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the addon "{addonToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setAddonToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
