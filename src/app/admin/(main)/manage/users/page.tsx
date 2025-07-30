
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
import { ChevronDown, Edit, Trash2, Printer, FileText, FileSpreadsheet, PlusCircle, UserCheck, UserX, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from 'next/navigation';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'Admin' | 'Staff' | 'Manager';
  status: 'Active' | 'Inactive';
  password?: string;
  createdAt?: any;
}

const ALL_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'userType', label: 'User Type' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action' },
];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Firebase is not configured correctly.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setUsers(usersData);
    } catch (error) {
        console.error("Error fetching users from Firestore:", error);
        toast({ title: "Error", description: "Could not fetch users from Firestore.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const filteredUsers = users.filter(user =>
    Object.values(user).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
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

  const handleEditClick = (userId: string) => {
    router.push(`/admin/manage/users/edit/${userId}`);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !db) return;
    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      toast({ title: "User Deleted", description: `User "${userToDelete.name}" has been removed.` });
      fetchUsers(); // Refresh the list
    } catch (error) {
       console.error("Error deleting user from Firestore:", error);
       toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
    } finally {
       setShowDeleteDialog(false);
       setUserToDelete(null);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !db) return;

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { status: newStatus });
        toast({
            title: `User Status Updated`,
            description: `User "${user.name}" is now ${newStatus}.`,
        });
        fetchUsers(); // Refresh list to show new status
    } catch (error) {
        toast({ title: "Update Error", description: "Could not update user status.", variant: "destructive" });
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const header = visibleColumns.map(col => col.label);
    const body = filteredUsers.map(item => 
      visibleColumns.map(col => String(item[col.id as keyof User] ?? 'N/A'))
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_export.xlsx");
    toast({ title: "Export Success", description: "Users data exported to Excel."});
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const visibleColumns = ALL_COLUMNS.filter(col => columnVisibility[col.id] && col.id !== 'action');
    const tableHeaders = visibleColumns.map(col => col.label);
    const tableData = filteredUsers.map(item =>
      visibleColumns.map(col => String(item[col.id as keyof User] ?? 'N/A'))
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [205, 33, 34] }, 
      margin: { top: 15 }
    });
    doc.text("Users List", 14, 10);
    doc.save("users_export.pdf");
    toast({ title: "Export Success", description: "Users data exported to PDF."});
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Users</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/manage/users/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User
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
            placeholder="Search users..."
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
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="border-border hover:bg-muted/50">
                  {columnVisibility.name && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{user.name}</TableCell>}
                  {columnVisibility.email && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{user.email}</TableCell>}
                  {columnVisibility.userType && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{user.userType}</TableCell>}
                  {columnVisibility.status && (
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'Active' 
                          ? 'bg-green-600 text-green-100' 
                          : 'bg-red-600 text-red-100'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                  )}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="text-[rgb(56_189_248)] hover:text-[rgb(56_189_248)]/90 h-8 w-8" onClick={() => handleEditClick(user.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8" onClick={() => handleDeleteClick(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" 
                          className={`${user.status === 'Active' ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'} h-8 w-8`}
                          title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                          onClick={() => toggleUserStatus(user.id)}
                         >
                          {user.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
               {paginatedUsers.length === 0 && !isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">
                    No users found.
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
            Showing {paginatedUsers.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
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
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              "{userToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
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
