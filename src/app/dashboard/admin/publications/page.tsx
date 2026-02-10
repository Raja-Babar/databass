
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '@/hooks/use-auth';

// Dummy data for generated bills - replace with your actual data source
type BillEntry = {
  id: number;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

type GeneratedBill = {
  id: number;
  purchaserName: string;
  date: string;
  totalAmount: number;
  entries: BillEntry[];
};


export default function PublicationsPage() {
  const [generatedBills, setGeneratedBills] = useState<GeneratedBill[]>([]);
  const { appLogo } = useAuth();

  useEffect(() => {
    try {
        const storedBills = localStorage.getItem('generatedBills');
        if (storedBills) {
            setGeneratedBills(JSON.parse(storedBills));
        }
    } catch (e) {
        console.error("Error loading bills from localStorage", e);
    }
  }, []);

  const generateAndSavePDF = (bill: GeneratedBill) => {
    const doc = new jsPDF();
    const { id, purchaserName, date, totalAmount, entries } = bill;

    const img = new window.Image()
    img.src = appLogo;
    img.onload = () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.addImage(img, 'PNG', 14, 10, 20, 20);
        
        doc.setFontSize(14);
        doc.text(`Bill for ${purchaserName}`, 14, 40);
        doc.setFontSize(10);
        doc.text(`Invoice No: ${id}`, pageWidth - 14, 40, { align: 'right' });
        doc.text(`Date: ${date}`, 14, 46);

        (doc as any).autoTable({
          head: [['Sr. No.', 'Book Title', 'Qty', 'Unit Price', 'Discount %', 'Total']],
          body: entries.map((entry, index) => {
            const discountAmount = entry.unitPrice * (entry.discountPercent / 100);
            const discountedPrice = entry.unitPrice - discountAmount;
            const totalAmount = discountedPrice * entry.quantity;
            return [
              index + 1,
              entry.bookTitle,
              entry.quantity,
              entry.unitPrice.toFixed(2),
              `${entry.discountPercent}%`,
              totalAmount.toFixed(2),
            ];
          }),
          startY: 52,
          foot: [['', '', '', '', 'Overall Total (Rs.)', totalAmount.toFixed(2)]],
          footStyles: {
            fillColor: [230, 230, 230],
            textColor: 20,
            fontStyle: 'bold',
          },
        });

        doc.save(`bill_${purchaserName.replace(/\s+/g, '_')}_${id}.pdf`);
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bills-Records</h1>
        <p className="text-muted-foreground mt-2">Manage and view generated bills.</p>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Bills-Record</CardTitle>
              <CardDescription>A record of all previously generated bills.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Sr. No.</TableHead>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Purchaser Name</TableHead>
                          <TableHead>Books Quantity</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total Amount (Rs.)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {generatedBills.length > 0 ? (
                          generatedBills.map((bill, index) => (
                              <TableRow key={bill.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">{bill.id}</TableCell>
                                  <TableCell>{bill.purchaserName}</TableCell>
                                  <TableCell>
                                    {bill.entries.reduce((total, entry) => total + entry.quantity, 0)}
                                  </TableCell>
                                  <TableCell>{bill.date}</TableCell>
                                  <TableCell className="font-semibold">{bill.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => generateAndSavePDF(bill)}>
                                          <Download className="mr-2 h-4 w-4" />
                                          Download PDF
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center">
                                  No bills have been generated yet.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
    </div>
  );
}
