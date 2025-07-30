
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
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
import { type Event } from '@/lib/initial-data';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const ALL_COLUMNS = [
  { id: 'eventTitle', label: 'Event Title' },
  { id: 'category', label: 'Category' },
  { id: 'date', label: 'Date & Time' },
  { id: 'location', label: 'Location' },
  { id: 'status', label: 'Reg. Status' },
  { id: 'action', label: 'Action' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
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
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const eventsCollection = collection(db, "events");
        const q = query(eventsCollection, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
        setEvents(eventsData);
    } catch (error) {
        console.error("Error fetching events from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch events data from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  const filteredEvents = useMemo(() => events.filter(event =>
    Object.values(event).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [events, searchTerm]);

  const totalPages = Math.ceil(filteredEvents.length / rowsPerPage);
  const paginatedEvents = useMemo(() => filteredEvents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ), [filteredEvents, currentPage, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleEditClick = (eventId: string) => {
    router.push(`/admin/events/edit/${eventId}`);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete || !db) return;
    try {
      await deleteDoc(doc(db, "events", eventToDelete.id));
      toast({
        title: "Event Deleted",
        description: `"${eventToDelete.eventTitle}" has been removed from Firestore.`,
      });
      fetchEvents(); // Refresh the list
    } catch (error) {
       console.error("Error deleting event from Firestore:", error);
       toast({ title: "Error", description: "Could not delete event.", variant: "destructive" });
    } finally {
       setShowDeleteDialog(false);
       setEventToDelete(null);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const header = visibleColumns.map(col => col.label);
    const body = filteredEvents.map(event => 
      visibleColumns.map(col => {
        if (col.id === 'date') return new Date(event.date).toLocaleString();
        if (col.id === 'status') return event.registrationStatus;
        return String(event[col.id as keyof Event] ?? 'N/A')
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, "events_export.xlsx");
    toast({ title: "Export Success", description: "Events data exported to Excel."});
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const tableHeaders = visibleColumns.map(col => col.label);
    const tableData = filteredEvents.map(event =>
      visibleColumns.map(col => {
        if (col.id === 'date') return new Date(event.date).toLocaleString();
        if (col.id === 'status') return event.registrationStatus;
        return String(event[col.id as keyof Event] ?? 'N/A')
      })
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [205, 33, 34] }, 
      margin: { top: 15 }
    });
    doc.text("Events List", 14, 10);
    doc.save("events_export.pdf");
    toast({ title: "Export Success", description: "Events data exported to PDF."});
  };
  
  const getStatusBadgeVariant = (status: Event['registrationStatus']) => {
    switch (status) {
      case 'open': return 'bg-green-600 text-white';
      case 'closed': return 'bg-red-600 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading events from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/events/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New
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
              {[5, 10, 20, 50].map(num => (
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
            placeholder="Search events..."
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
              {paginatedEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50">
                  {columnVisibility.eventTitle && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{event.eventTitle}</TableCell>}
                  {columnVisibility.category && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{event.category}</TableCell>}
                  {columnVisibility.date && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{new Date(event.date).toLocaleString()}</TableCell>}
                  {columnVisibility.location && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{event.location}</TableCell>}
                  {columnVisibility.status && (
                    <TableCell className="px-4 py-3 text-center whitespace-nowrap">
                       <Badge className={getStatusBadgeVariant(event.registrationStatus)}>
                          {event.registrationStatus.charAt(0).toUpperCase() + event.registrationStatus.slice(1)}
                       </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-[rgb(56_189_248)] hover:text-[rgb(56_189_248)]/90 h-8 w-8" onClick={() => handleEditClick(event.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8" onClick={() => handleDeleteClick(event)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
               {paginatedEvents.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">
                    No events found in Firestore.
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
            Showing {paginatedEvents.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, filteredEvents.length)} of {filteredEvents.length} entries
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
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              "{eventToDelete?.eventTitle}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setEventToDelete(null);
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
