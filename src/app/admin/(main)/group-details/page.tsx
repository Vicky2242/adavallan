
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
import { Edit, Trash2, Eye, Loader2, Save, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image'; 
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch, query, where, orderBy } from 'firebase/firestore';


declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface GroupData {
  id: string; 
  groupName: string;
  danceSchoolId: string;
  studentCount: number;
  createdAt: string; 
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string; 
  eventId?: string;
}

interface StudentParticipantData {
  id: string; 
  groupId: string;
  participantId: string; 
  participantName: string;
  dateOfBirth: string; 
  gender: "male" | "female" | "other";
  phoneNumber: string;
  email: string;
  idProofDataUri?: string; 
  photoDataUri?: string;
  addedAt: string; 
  registrationStatus?: string;
}

interface GroupPaymentData {
  id: string; 
  razorpay_payment_id: string;
  razorpay_order_id: string;
  status: 'successful' | string; 
  paidAmount: number; 
  currency: string;
  paidOn: string; 
  groupId: string;
}

interface DanceSchoolRegistration {
  id: string; 
  danceSchoolName: string;
}

interface DisplayGroup extends GroupData {
  danceSchoolName?: string;
  paymentDetails?: GroupPaymentData;
  students?: StudentParticipantData[];
}

const ALL_COLUMNS = [
  { id: 'groupName', label: 'Group Name' },
  { id: 'danceSchoolName', label: 'Dance School' },
  { id: 'studentCount', label: 'Students #' },
  { id: 'paymentStatus', label: 'Payment' },
  { id: 'paidAmount', label: 'Paid Amt.' },
  { id: 'paidOn', label: 'Paid On' },
  { id: 'createdAt', label: 'Registered' },
  { id: 'action', label: 'Action' },
];

export default function ManageGroupDetailsPage() {
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<DisplayGroup | null>(null);

  const [showViewDialog, setShowViewDialog] = useState(false);
  const [groupToView, setGroupToView] = useState<DisplayGroup | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<DisplayGroup | null>(null);
  const [editFormData, setEditFormData] = useState<{ groupName: string }>({ groupName: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [showStudentDetailViewDialog, setShowStudentDetailViewDialog] = useState(false);
  const [studentToViewDetails, setStudentToViewDetails] = useState<StudentParticipantData | null>(null);
  
  const fetchAndPrepareGroupData = useCallback(async () => {
    setIsLoading(true);
    if(firebaseInitializationError || !db) {
      toast({ title: "Database Error", description: "Cannot fetch group data. Firebase not configured.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    try {
      const groupsQuery = query(collection(db, "groups"), orderBy("createdAt", "desc"));
      const schoolsQuery = query(collection(db, "dance-schools"));
      const paymentsQuery = query(collection(db, "group_payments"));
      const participantsQuery = query(collection(db, "group_participants"));
      
      const [groupsSnapshot, schoolsSnapshot, paymentsSnapshot, participantsSnapshot] = await Promise.all([
          getDocs(groupsQuery),
          getDocs(schoolsQuery),
          getDocs(paymentsQuery),
          getDocs(participantsQuery)
      ]);

      const allGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupData[];
      const allSchools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DanceSchoolRegistration[];
      const allPayments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupPaymentData[];
      const allParticipants = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StudentParticipantData[];

      const schoolsMap = new Map(allSchools.map(s => [s.id, s.danceSchoolName]));
      const paymentsMap = new Map(allPayments.map(p => [p.groupId, p]));
      const participantsMap = new Map<string, StudentParticipantData[]>();
      allParticipants.forEach(p => {
        if(!participantsMap.has(p.groupId)) participantsMap.set(p.groupId, []);
        participantsMap.get(p.groupId)!.push(p);
      });

      const preparedGroups: DisplayGroup[] = allGroups.map(group => ({
          ...group,
          danceSchoolName: schoolsMap.get(group.danceSchoolId) || 'N/A',
          paymentDetails: paymentsMap.get(group.id), 
          students: participantsMap.get(group.id) || [],
      }));
      
      setDisplayGroups(preparedGroups);
    } catch (error) {
      console.error("Error fetching group data from Firestore: ", error);
      toast({ title: "Error Loading Groups", variant: "destructive", description: "Could not load group data from Firestore." });
      setDisplayGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndPrepareGroupData();
  }, [fetchAndPrepareGroupData]);
  
  // Filtering and Pagination remain the same
  const filteredGroups = useMemo(() => displayGroups.filter(group =>
    Object.values(group).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    ) || (group.danceSchoolName && group.danceSchoolName.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [displayGroups, searchTerm]);

  const totalPages = useMemo(() => Math.ceil(filteredGroups.length / rowsPerPage), [filteredGroups.length, rowsPerPage]);
  
  const paginatedGroups = useMemo(() => filteredGroups.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ), [filteredGroups, currentPage, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value);
  const handleRowsPerPageChange = (value: string) => setRowsPerPage(parseInt(value, 10));

  const handleEdit = useCallback((group: DisplayGroup) => {
    setGroupToEdit(group);
    setEditFormData({ groupName: group.groupName });
    setShowEditDialog(true);
  }, []);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({ groupName: e.target.value });

  const handleSaveEdit = useCallback(async () => {
    if (!groupToEdit || !editFormData.groupName.trim() || !db) return;
    setIsSavingEdit(true);
    try {
      const groupDocRef = doc(db, 'groups', groupToEdit.id);
      await updateDoc(groupDocRef, { groupName: editFormData.groupName.trim() });
      fetchAndPrepareGroupData();
      toast({ title: "Group Updated" });
      setShowEditDialog(false);
    } catch (error) {
      toast({ title: "Error Updating Group", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
      setGroupToEdit(null);
    }
  }, [groupToEdit, editFormData, fetchAndPrepareGroupData, toast]);

  const handleDelete = useCallback((group: DisplayGroup) => {
    setGroupToDelete(group);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!groupToDelete || !db) return;
    try {
        const batch = writeBatch(db);
        const groupDocRef = doc(db, 'groups', groupToDelete.id);
        batch.delete(groupDocRef);

        const participantsQuery = query(collection(db, "group_participants"), where("groupId", "==", groupToDelete.id));
        const participantsSnapshot = await getDocs(participantsQuery);
        participantsSnapshot.forEach(doc => batch.delete(doc.ref));

        const paymentsQuery = query(collection(db, "group_payments"), where("groupId", "==", groupToDelete.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        fetchAndPrepareGroupData();
        toast({ title: "Group Deleted" });
    } catch (error) {
      toast({ title: "Error Deleting Group", variant: "destructive" });
    } finally {
      setShowDeleteDialog(false);
      setGroupToDelete(null);
    }
  }, [groupToDelete, fetchAndPrepareGroupData, toast]);

  const handleViewGroupDetails = useCallback((group: DisplayGroup) => {
    setGroupToView(group);
    setShowViewDialog(true);
  }, []);

  const handleViewStudentDetails = useCallback((student: StudentParticipantData) => {
    setStudentToViewDetails(student);
    setShowStudentDetailViewDialog(true);
  }, []);
  
  const handleExportGroupToExcel = useCallback((group: DisplayGroup | null) => {
    if (!group) return;
    toast({ title: "Export Group to Excel", description: `Exporting details for group: ${group.groupName}` });
    const studentsData = group.students?.map(s => ({
      'Participant ID': s.participantId, 'Name': s.participantName, 'DOB': s.dateOfBirth, 'Gender': s.gender, 'Email': s.email, 'Phone': s.phoneNumber,
      'Reg. Status': (group.paymentStatus === 'paid' || s.registrationStatus === 'payment_successful') ? 'Payment Successful' : (s.registrationStatus || 'Pending'),
    })) || [];
    const wsData = [
      ["Group Name:", group.groupName], ["Dance School:", group.danceSchoolName || 'N/A'], ["Student Count:", group.studentCount],
      ["Registered On:", new Date(group.createdAt).toLocaleDateString()], ["Payment Status:", group.paymentStatus.toUpperCase()], [], 
      ["Payment ID:", group.paymentDetails?.razorpay_payment_id || 'N/A'], ["Order ID:", group.paymentDetails?.razorpay_order_id || 'N/A'],
      ["Amount Paid:", group.paymentDetails ? `Rs ${group.paymentDetails.paidAmount.toFixed(2)}` : 'N/A'], ["Paid On:", group.paymentDetails?.paidOn ? new Date(group.paymentDetails.paidOn).toLocaleDateString() : 'N/A'],
      [], ["Students:"],
      ...(studentsData.length > 0 ? XLSX.utils.sheet_to_json(XLSX.utils.json_to_sheet(studentsData), {header:1}) : [["No student data available"]])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Group Details");
    XLSX.writeFile(wb, `${group.groupName.replace(/\s+/g, '_')}_details.xlsx`);
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
        <p className="ml-3 text-foreground">Loading group details from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Group Details</h1>

       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Show</span>
          <Input type="number" value={rowsPerPage} onChange={e => handleRowsPerPageChange(e.target.value)} className="w-20 h-9" />
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            type="search"
            placeholder="Search groups..."
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
              {paginatedGroups.map((group) => (
                <TableRow key={group.id} className="border-border hover:bg-muted/50">
                  {columnVisibility.groupName && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{group.groupName}</TableCell>}
                  {columnVisibility.danceSchoolName && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{group.danceSchoolName}</TableCell>}
                  {columnVisibility.studentCount && <TableCell className="px-4 py-3 text-foreground text-center whitespace-nowrap">{group.studentCount}</TableCell>}
                  {columnVisibility.paymentStatus && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        group.paymentStatus === 'paid' ? 'bg-green-600 text-green-100' : 
                        group.paymentStatus === 'pending' ? 'bg-yellow-500 text-yellow-900' : 'bg-red-600 text-red-100'
                      }`}>
                        {group.paymentStatus.charAt(0).toUpperCase() + group.paymentStatus.slice(1)}
                      </span>
                    </TableCell>
                  )}
                  {columnVisibility.paidAmount && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{group.paymentDetails ? `₹${group.paymentDetails.paidAmount.toFixed(2)}` : 'N/A'}</TableCell>}
                  {columnVisibility.paidOn && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{group.paymentDetails?.paidOn ? new Date(group.paymentDetails.paidOn).toLocaleDateString() : 'N/A'}</TableCell>}
                  {columnVisibility.createdAt && <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">{new Date(group.createdAt).toLocaleDateString()}</TableCell>}
                  {columnVisibility.action && (
                    <TableCell className="px-4 py-3 text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300 h-8 w-8" onClick={() => handleEdit(group)} title="Edit Group Name">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 h-8 w-8" onClick={() => handleDelete(group)} title="Delete Group">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-emerald-400 hover:text-emerald-300 h-8 w-8" onClick={() => handleViewGroupDetails(group)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400 h-8 w-8" onClick={() => handleExportGroupToExcel(group)} title="Download Details">
                           <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
               {paginatedGroups.length === 0 && !isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={ALL_COLUMNS.filter(c => columnVisibility[c.id]).length} className="px-4 py-10 text-center text-muted-foreground">
                    No group details found in Firestore.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer and Dialogs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow text-sm text-muted-foreground">
        <div className="text-center sm:text-left">
         Showing {paginatedGroups.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
          {Math.min(currentPage * rowsPerPage, filteredGroups.length)} of {filteredGroups.length} entries
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
        </div>
      </div>

       <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Group Details: {groupToView?.groupName}</DialogTitle>
            <DialogDescription>Dance School: {groupToView?.danceSchoolName}</DialogDescription>
          </DialogHeader>
          {groupToView && (
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
              <h3 className="text-lg font-semibold text-primary">Group Information</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p><span className="font-semibold text-muted-foreground">Student Count:</span> {groupToView.studentCount}</p>
                <p><span className="font-semibold text-muted-foreground">Registered On:</span> {new Date(groupToView.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold text-muted-foreground">Payment Status:</span> <span className={`font-medium ${groupToView.paymentStatus === 'paid' ? 'text-green-500' : 'text-yellow-400'}`}>{groupToView.paymentStatus.toUpperCase()}</span></p>
              </div>
              {groupToView.paymentDetails && (
                <>
                  <h3 className="text-lg font-semibold text-primary mt-3">Payment Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <p><span className="font-semibold text-muted-foreground">Payment ID:</span> <span className="truncate block">{groupToView.paymentDetails.razorpay_payment_id}</span></p>
                    <p><span className="font-semibold text-muted-foreground">Order ID:</span> <span className="truncate block">{groupToView.paymentDetails.razorpay_order_id}</span></p>
                    <p><span className="font-semibold text-muted-foreground">Amount Paid:</span> ₹{groupToView.paymentDetails.paidAmount.toFixed(2)} {groupToView.paymentDetails.currency}</p>
                    <p><span className="font-semibold text-muted-foreground">Paid On:</span> {new Date(groupToView.paymentDetails.paidOn).toLocaleDateString()}</p>
                  </div>
                </>
              )}
              <h3 className="text-lg font-semibold text-primary mt-3">Students ({groupToView.students?.length || 0})</h3>
              {groupToView.students && groupToView.students.length > 0 ? (
                <div className="space-y-3">
                  {groupToView.students.map((student, idx) => (
                    <Card key={student.id} className="bg-muted/50 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{idx + 1}. {student.participantName} (ID: {student.participantId})</p>
                          <p className="text-xs text-muted-foreground">Email: {student.email} | Phone: {student.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">DOB: {student.dateOfBirth} | Gender: {student.gender}</p>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 h-7 w-7" title="View Student Details" onClick={() => handleViewStudentDetails(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No student details available for this group.</p>}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete group "{groupToDelete?.groupName}" and all its students and payments from Firestore. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Group Name</DialogTitle></DialogHeader>
           <div className="py-4 space-y-2"><Label htmlFor="editGroupName">New Group Name</Label><Input id="editGroupName" value={editFormData.groupName} onChange={handleEditFormChange} /></div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>{isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showStudentDetailViewDialog} onOpenChange={setShowStudentDetailViewDialog}>
        <DialogContent className="max-w-xl"> 
          <DialogHeader>
            <DialogTitle className="text-xl">Student Details: {studentToViewDetails?.participantName}</DialogTitle>
            <DialogDescription>Participant ID: {studentToViewDetails?.participantId}</DialogDescription>
          </DialogHeader>
          {studentToViewDetails && (
            <div className="space-y-3 py-4 text-sm max-h-[70vh] overflow-y-auto"> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"> 
                <p><span className="font-semibold text-muted-foreground">Date of Birth:</span> {studentToViewDetails.dateOfBirth}</p>
                <p><span className="font-semibold text-muted-foreground">Gender:</span> {studentToViewDetails.gender}</p>
                <p><span className="font-semibold text-muted-foreground">Phone:</span> {studentToViewDetails.phoneNumber}</p>
                <p><span className="font-semibold text-muted-foreground">Email:</span> {studentToViewDetails.email}</p>
                <p><span className="font-semibold text-muted-foreground">Added On:</span> {new Date(studentToViewDetails.addedAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Photo:</h4>
                  {studentToViewDetails.photoDataUri ? <Image src={studentToViewDetails.photoDataUri} alt="Student Photo" width={150} height={150} className="rounded-md border object-cover" data-ai-hint="student photo"/> : <p className="text-muted-foreground italic text-xs">No photo uploaded.</p>}
                </div>
                 <div>
                  <h4 className="font-semibold mb-1">ID Proof:</h4>
                  {studentToViewDetails.idProofDataUri && studentToViewDetails.idProofDataUri.startsWith('data:image') ? <Image src={studentToViewDetails.idProofDataUri} alt="ID Proof Preview" width={200} height={120} className="rounded-md border object-contain" data-ai-hint="id card document"/> : studentToViewDetails.idProofDataUri ? <a href={studentToViewDetails.idProofDataUri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Document</a> : <p className="text-muted-foreground italic text-xs">No ID proof uploaded.</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="mt-2 sm:mt-0">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
