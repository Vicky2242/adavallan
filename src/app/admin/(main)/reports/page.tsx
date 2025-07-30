
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Search, XCircle } from 'lucide-react';

interface SearchCriteria {
  fromDate: string;
  toDate: string;
  category: string;
  currency: string;
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [activeSearchCriteria, setActiveSearchCriteria] = useState<SearchCriteria | null>(null);
  const { toast } = useToast();

  const handleSearch = () => {
    if (!fromDate && !toDate && category === 'all' && currency === 'all') {
      toast({
        title: "No Criteria Set",
        description: "Please select at least one search criterion.",
        variant: "default",
      });
      setActiveSearchCriteria(null);
      return;
    }
    const criteria: SearchCriteria = { fromDate, toDate, category, currency };
    setActiveSearchCriteria(criteria);
    toast({
      title: "Search Initiated",
      description: "Displaying results based on your criteria (mock).",
    });
    // In a real app, you would fetch and display data here
    console.log("Search criteria:", criteria);
  };

  const handleClearSearch = () => {
    setFromDate('');
    setToDate('');
    setCategory('all');
    setCurrency('all');
    setActiveSearchCriteria(null);
    toast({
      title: "Search Cleared",
      description: "Search criteria and results have been cleared.",
    });
  };

  const getCategoryLabel = (value: string) => {
    const options: Record<string, string> = {
      all: 'All Categories',
      events: 'Events',
      applicants: 'Applicants',
      payments: 'Payments',
    };
    return options[value] || value;
  };

  const getCurrencyLabel = (value: string) => {
    const options: Record<string, string> = {
      all: 'All Currencies',
      INR: 'INR',
      USD: 'USD',
    };
    return options[value] || value;
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Generate and view customized reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filter Reports</CardTitle>
          <CardDescription>
            Select criteria to generate your report.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="applicants">Applicants</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    {/* Add more currencies as needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" className="font-semibold px-6 py-2 w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
              <Button type="button" variant="outline" onClick={handleClearSearch} className="font-semibold px-6 py-2 w-full sm:w-auto">
                 <XCircle className="mr-2 h-4 w-4" /> Clear Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {activeSearchCriteria && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">Report Results (Mock)</CardTitle>
            <CardDescription>
              Displaying mock results for the following criteria:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p><strong>From Date:</strong> {activeSearchCriteria.fromDate || 'Not set'}</p>
            <p><strong>To Date:</strong> {activeSearchCriteria.toDate || 'Not set'}</p>
            <p><strong>Category:</strong> {getCategoryLabel(activeSearchCriteria.category)}</p>
            <p><strong>Currency:</strong> {getCurrencyLabel(activeSearchCriteria.currency)}</p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm italic">
                This is a placeholder for actual report data. In a real application,
                tables or charts with fetched data would be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {!activeSearchCriteria && (
         <Card className="mt-6">
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>Please select search criteria and click "Search" to generate a report.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
