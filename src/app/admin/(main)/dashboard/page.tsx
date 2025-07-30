
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

// Define interfaces for the data structures from Firestore
interface IndividualRegistration {
  id: string;
  paymentStatus: 'successful' | 'pending' | 'failed';
  paidAmount?: string;
  paidOn?: string;
}

interface GroupRegistration {
  id: string;
  studentCount: number;
}

interface GroupPayment {
    paidAmount: number;
    currency: string;
    paidOn: string;
    status: 'successful' | string;
}


interface SummaryDataRow {
  currency: string;
  previousMonth: string;
  thisMonth: string;
  total: string;
}

export default function AdminDashboardPage() {
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalINRReceived, setTotalINRReceived] = useState(0);
  const [inrThisMonth, setInrThisMonth] = useState(0);
  const [inrPreviousMonth, setInrPreviousMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDataFromFirestore = useCallback(async () => {
    setIsLoading(true);

    if (firebaseInitializationError || !db) {
        toast({ title: "Database Error", description: "Cannot load dashboard data from Firestore.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      // Fetch all necessary data in parallel
      const individualRegsQuery = query(collection(db, "registrations"));
      const groupRegsQuery = query(collection(db, "groups"));
      const groupPaymentsQuery = query(collection(db, "group_payments"));
      
      const [
        individualRegsSnapshot,
        groupRegsSnapshot,
        groupPaymentsSnapshot,
      ] = await Promise.all([
        getDocs(individualRegsQuery),
        getDocs(groupRegsQuery),
        getDocs(groupPaymentsQuery)
      ]);

      const individualRegistrations = individualRegsSnapshot.docs.map(doc => doc.data() as IndividualRegistration);
      const groupRegistrations = groupRegsSnapshot.docs.map(doc => doc.data() as GroupRegistration);
      const groupPayments = groupPaymentsSnapshot.docs.map(doc => doc.data() as GroupPayment);

      // --- Calculate Total Applications ---
      const individualCount = individualRegistrations.length;
      const groupStudentCount = groupRegistrations.reduce((sum, group) => sum + (Number(group.studentCount) || 0), 0);
      setTotalApplications(individualCount + groupStudentCount);

      // --- Calculate Total Payments ---
      let currentTotalInr = 0;
      let currentMonthInr = 0;
      let prevMonthInr = 0;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);

      // Process individual successful payments
      individualRegistrations.forEach(reg => {
        if (reg.paymentStatus === 'successful' && reg.paidAmount) {
            const amount = parseFloat(reg.paidAmount) || 0;
            currentTotalInr += amount;
            
            if (reg.paidOn) {
                const paidDate = new Date(reg.paidOn);
                if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
                  currentMonthInr += amount;
                }
                if (paidDate.getFullYear() === prevMonthDate.getFullYear() && paidDate.getMonth() === prevMonthDate.getMonth()) {
                  prevMonthInr += amount;
                }
            }
        }
      });
      
      // Process group successful payments
      groupPayments.forEach(payment => {
          if (payment.status === 'successful' && payment.paidAmount && payment.paidOn) {
            const amount = Number(payment.paidAmount) || 0;
            currentTotalInr += amount;

            const paidDate = new Date(payment.paidOn);
             if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
              currentMonthInr += amount;
            }
            if (paidDate.getFullYear() === prevMonthDate.getFullYear() && paidDate.getMonth() === prevMonthDate.getMonth()) {
              prevMonthInr += amount;
            }
          }
      });

      setTotalINRReceived(currentTotalInr);
      setInrThisMonth(currentMonthInr);
      setInrPreviousMonth(prevMonthInr);

    } catch (error) {
      console.error("Error fetching dashboard data from Firestore: ", error);
      toast({
        title: "Error Fetching Data",
        description: "Could not load dashboard statistics from Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDataFromFirestore();
  }, [fetchDataFromFirestore]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }, []);

  const summaryData: SummaryDataRow[] = useMemo(() => [
    { 
      currency: "INR", 
      previousMonth: formatCurrency(inrPreviousMonth), 
      thisMonth: formatCurrency(inrThisMonth), 
      total: formatCurrency(totalINRReceived) 
    },
  ], [inrPreviousMonth, inrThisMonth, totalINRReceived, formatCurrency]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
      </div>
      <p className="text-muted-foreground">Ulagam Muzhudhum Baratham | Baratha Manadu 2025 - Event Registration System</p>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-12 w-12 animate-spin text-foreground" />
          <p className="ml-3 text-foreground">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  Combined individual and group participants
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total INR Received</CardTitle>
                <IndianRupee className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{formatCurrency(totalINRReceived)}</div>
                 <p className="text-xs text-muted-foreground">
                  From individual and group registrations
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="text-muted-foreground whitespace-nowrap">Currency</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap">Previous Month</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap">This Month</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap">{row.currency}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.previousMonth}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.thisMonth}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.total}</TableCell>
                      </TableRow>
                    ))}
                     {summaryData.length === 0 && !isLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                            No payment data found.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
