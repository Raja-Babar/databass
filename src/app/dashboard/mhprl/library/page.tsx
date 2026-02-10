

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Download, Edit, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


type BillEntry = {
  id: number;
  bookTitle: string;
  bookTitleSindhi: string;
  date: string;
  time: string;
  purchaserName: string;
  purchaserNameSindhi: string;
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

type Book = {
  id: number;
  title: string;
  unitPrice: number;
};

export default function AutoGenerateBillPage() {
  const { toast } = useToast();
  const [billEntries, setBillEntries] = useState<BillEntry[]>([]);
  const [generatedBills, setGeneratedBills] = useState<GeneratedBill[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [nextBillId, setNextBillId] = useState(1);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [nextBookId, setNextBookId] = useState(1);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookPrice, setNewBookPrice] = useState('');
  const [isBookEditDialogOpen, setIsBookEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editedBookTitle, setEditedBookTitle] = useState('');
  const [editedBookPrice, setEditedBookPrice] = useState('');

  const [bookTitle, setBookTitle] = useState('');
  const [bookTitleSindhi, setBookTitleSindhi] = useState('');
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserNameSindhi, setPurchaserNameSindhi] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [isBookSelected, setIsBookSelected] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BillEntry | null>(null);
  const [editedEntry, setEditedEntry] = useState({
    bookTitle: '',
    bookTitleSindhi: '',
    purchaserName: '',
    purchaserNameSindhi: '',
    quantity: '',
    unitPrice: '',
    discountPercent: '',
  });
  
  useEffect(() => {
    try {
      const storedBills = localStorage.getItem('generatedBills');
      const storedBooks = localStorage.getItem('libraryBooks');

      if (storedBills) {
        const parsedBills = JSON.parse(storedBills);
        setGeneratedBills(parsedBills);
        if (parsedBills.length > 0) {
            const maxId = Math.max(...parsedBills.map((b: GeneratedBill) => b.id));
            setNextBillId(maxId + 1);
        }
      }
      if (storedBooks) {
        const parsedBooks = JSON.parse(storedBooks);
        setBooks(parsedBooks);
        if (parsedBooks.length > 0) {
          const maxId = Math.max(...parsedBooks.map((b: Book) => b.id));
          setNextBookId(maxId + 1);
        }
      }
    } catch (e) {
      console.error("Error loading data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('generatedBills', JSON.stringify(generatedBills));
      localStorage.setItem('libraryBooks', JSON.stringify(books));
    } catch (e) {
      console.error("Error saving data to localStorage", e);
    }
  }, [generatedBills, books]);
  
  const handleAddBook = () => {
    const price = parseFloat(newBookPrice);
    if (!newBookTitle || isNaN(price) || price < 0) {
      toast({
        variant: 'destructive',
        title: 'Missing or Invalid Fields',
        description: 'Please provide a title and a valid price.',
      });
      return;
    }
    setBooks(prev => [...prev, {id: nextBookId, title: newBookTitle, unitPrice: price}]);
    setNextBookId(prev => prev + 1);
    setNewBookTitle('');
    setNewBookPrice('');
    toast({ title: 'Book Added', description: `"${newBookTitle}" has been added to your library.` });
  };
  
  const handleDeleteBook = (id: number) => {
    setBooks(prev => prev.filter(book => book.id !== id));
    toast({ title: 'Book Removed', description: 'The book has been removed from your library.' });
  };
  
  const handleEditBookClick = (book: Book) => {
    setSelectedBook(book);
    setEditedBookTitle(book.title);
    setEditedBookPrice(book.unitPrice.toString());
    setIsBookEditDialogOpen(true);
  };

  const handleUpdateBook = () => {
    const price = parseFloat(editedBookPrice);
    if (selectedBook && !isNaN(price)) {
      setBooks(prev => prev.map(book =>
        book.id === selectedBook.id ? { ...book, title: editedBookTitle, unitPrice: price } : book
      ));
      setIsBookEditDialogOpen(false);
      setSelectedBook(null);
      toast({ title: 'Book Updated', description: 'The book details have been updated.' });
    }
  };

  const handleSelectBookForBill = (book: Book) => {
    setBookTitle(book.title);
    setUnitPrice(book.unitPrice.toString());
    setIsBookSelected(true);
    toast({
        title: 'Book Selected',
        description: `"${book.title}" has been added to the form.`,
    });
  };


  const handleAddEntry = () => {
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const discount = parseFloat(discountPercent);

    if (!bookTitle || !purchaserName || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
      toast({
        variant: 'destructive',
        title: 'Missing or Invalid Fields',
        description: 'Please fill in all required fields with valid values.',
      });
      return;
    }
    
    const now = new Date();
    const newBillEntry: BillEntry = {
      id: nextEntryId,
      bookTitle,
      bookTitleSindhi,
      purchaserName,
      purchaserNameSindhi,
      date: now.toLocaleDateString('en-US'),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      quantity: qty,
      unitPrice: price,
      discountPercent: isNaN(discount) ? 0 : discount,
    };

    setBillEntries(prev => [...prev, newBillEntry]);
    setNextEntryId(prev => prev + 1);

    // Reset form
    setBookTitle('');
    setBookTitleSindhi('');
    setPurchaserName('');
    setPurchaserNameSindhi('');
    setQuantity('');
    setUnitPrice('');
    setDiscountPercent('0');
    setIsBookSelected(false);

    toast({
      title: 'Entry Added',
      description: 'The new entry has been added to the current bill.',
    });
  };

  const handleDeleteEntry = (id: number) => {
    setBillEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: 'Entry Removed',
      description: 'The selected entry has been removed from the bill.',
    });
  };

  const handleEditClick = (entry: BillEntry) => {
    setSelectedEntry(entry);
    setEditedEntry({
      bookTitle: entry.bookTitle,
      bookTitleSindhi: entry.bookTitleSindhi,
      purchaserName: entry.purchaserName,
      purchaserNameSindhi: entry.purchaserNameSindhi,
      quantity: entry.quantity.toString(),
      unitPrice: entry.unitPrice.toString(),
      discountPercent: entry.discountPercent.toString(),
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateEntry = () => {
    if (selectedEntry) {
        setBillEntries(prev => prev.map(entry =>
            entry.id === selectedEntry.id ? {
                ...entry,
                bookTitle: editedEntry.bookTitle,
                bookTitleSindhi: editedEntry.bookTitleSindhi,
                purchaserName: editedEntry.purchaserName,
                purchaserNameSindhi: editedEntry.purchaserNameSindhi,
                quantity: parseFloat(editedEntry.quantity),
                unitPrice: parseFloat(editedEntry.unitPrice),
                discountPercent: parseFloat(editedEntry.discountPercent),
            } : entry
        ));
        setIsEditDialogOpen(false);
        setSelectedEntry(null);
        toast({
            title: 'Entry Updated',
            description: 'The bill entry has been successfully updated.',
        });
    }
  };


  const calculateRow = (entry: BillEntry) => {
    const discountAmount = entry.unitPrice * (entry.discountPercent / 100);
    const discountedPrice = entry.unitPrice - discountAmount;
    const totalAmount = discountedPrice * entry.quantity;
    return { discountedPrice, totalAmount };
  };

  const totalQuantity = billEntries.reduce((acc, entry) => acc + entry.quantity, 0);
  
  const overallTotal = billEntries.reduce((acc, entry) => {
    const { totalAmount } = calculateRow(entry);
    return acc + totalAmount;
  }, 0);

  const generateAndSavePDF = (bill: GeneratedBill) => {
    const doc = new jsPDF();
    const { id, purchaserName, date, totalAmount, entries } = bill;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.text(`Bill for ${purchaserName}`, 14, 16);
    doc.text(`Invoice No: ${id}`, pageWidth - 14, 16, { align: 'right' });
    doc.text(`Date: ${date}`, 14, 22);

    (doc as any).autoTable({
      head: [['Book Title / Author, Editor, Compiler, Translator', 'Purchaser Name', 'Qty', 'Unit Price', 'Discount %', 'Total']],
      body: entries.map(entry => {
        const { totalAmount } = calculateRow(entry);
        const bookTitleCombined = `${entry.bookTitle}\n${entry.bookTitleSindhi || ''}`;
        const purchaserNameCombined = `${entry.purchaserName}\n${entry.purchaserNameSindhi || ''}`;
        return [
          bookTitleCombined,
          purchaserNameCombined,
          entry.quantity,
          entry.unitPrice.toFixed(2),
          `${entry.discountPercent}%`,
          totalAmount.toFixed(2),
        ];
      }),
      startY: 30,
      foot: [['', '', '', '', 'Overall Total (Rs.)', totalAmount.toFixed(2)]],
      footStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontStyle: 'bold',
      },
      didParseCell: function(data: any) {
        // Check for Sindhi characters in the specific columns
        if (data.column.dataKey === 0 || data.column.dataKey === 1) { 
             const text = data.cell.raw as string;
             // A simple regex to detect Arabic script characters
             if (/[\u0600-\u06FF]/.test(text)) {
                 data.cell.styles.font = 'helvetica'; // A font with better unicode support
                 data.cell.styles.halign = 'right';
             }
        }
      }
    });

    doc.save(`bill_${purchaserName.replace(/\s+/g, '_')}_${id}.pdf`);
  };
  

  const handlePrint = () => {
    if (billEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Print Failed',
        description: 'There are no entries to print.',
      });
      return;
    }

    window.print();
    
    const billDate = new Date().toLocaleDateString('en-US');
    const purchaserName = billEntries.length > 0 ? billEntries[0].purchaserName : 'Customer';
    const newBill: GeneratedBill = {
        id: nextBillId,
        purchaserName,
        date: billDate,
        totalAmount: overallTotal,
        entries: [...billEntries],
    };
    
    setGeneratedBills(prev => [newBill, ...prev]);
    setNextBillId(prev => prev + 1);

    setBillEntries([]);
    setNextEntryId(1);
    
    toast({
        title: 'Bill Recorded',
        description: `Bill #${newBill.id} has been recorded in history.`,
    });
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body > *:not(.printable-bill) {
            display: none;
          }
          .printable-bill {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-Generate-Bill</h1>
          <p className="text-muted-foreground mt-2">Create and manage bills for book sales.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Books</CardTitle>
            <CardDescription>Add, edit, or delete books from your library inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                <div className="md:col-span-1 space-y-2">
                    <Label htmlFor="newBookTitle">Book Title / Author, Editor, Compiler, Translator</Label>
                    <Input id="newBookTitle" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} placeholder="e.g., History of Sindh" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="newBookPrice">Unit Price (Rs.)</Label>
                    <Input id="newBookPrice" type="number" value={newBookPrice} onChange={e => setNewBookPrice(e.target.value)} placeholder="e.g., 500" />
                </div>
                <Button onClick={handleAddBook} className="self-end">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Book
                </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title / Author, Editor, Compiler, Translator</TableHead>
                  <TableHead>Unit Price (Rs.)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.length > 0 ? (
                  books.map(book => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleSelectBookForBill(book)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add to Bill
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditBookClick(book)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBook(book.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No books added yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Bill Entry</CardTitle>
            <CardDescription>
              Fill in the details below to add a new item to the current bill.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bookTitle">Book Title / Author, Editor, Compiler, Translator</Label>
                  <Label htmlFor="bookTitleSindhi" className="font-sindhi text-lg" dir="rtl">ڪتاب جو عنوان / ليکڪ</Label>
                </div>
                <Input
                  id="bookTitle"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g., History of Sindh"
                  dir="auto"
                  readOnly={isBookSelected}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="bookTitleSindhi"
                  value={bookTitleSindhi}
                  onChange={(e) => setBookTitleSindhi(e.target.value)}
                  placeholder="مثال طور، آپ بيتي جڳ بيتي"
                  className="font-sindhi"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="purchaserName">Purchaser Name</Label>
                  <Label htmlFor="purchaserNameSindhi" className="font-sindhi text-lg" dir="rtl">خريدار جو نالو</Label>
                </div>
                <Input id="purchaserName" value={purchaserName} onChange={e => setPurchaserName(e.target.value)} placeholder="e.g., Ali Khan" />
              </div>
              <div className="space-y-2">
                <Input
                  id="purchaserNameSindhi"
                  value={purchaserNameSindhi}
                  onChange={(e) => setPurchaserNameSindhi(e.target.value)}
                  placeholder="مثال طور، علي خان"
                  className="font-sindhi"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quantity">Quantity Sold</Label>
                  <span className="font-sindhi text-lg" dir="rtl">وڪرو ٿيل مقدار</span>
                </div>
                <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unitPrice">Unit Price (Rs.)</Label>
                  <span className="font-sindhi text-lg" dir="rtl">يونٽ جي قيمت (روپيا)</span>
                </div>
                <Input id="unitPrice" type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="e.g., 500" readOnly={isBookSelected} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="discountPercent">Discount %</Label>
                  <span className="font-sindhi text-lg" dir="rtl">رعايت٪</span>
                </div>
                <Input id="discountPercent" type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="e.g., 10" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddEntry}>
              <PlusCircle className="mr-2" /> Add to Bill
            </Button>
          </CardFooter>
        </Card>

        <Card className="printable-bill">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Current Bill</CardTitle>
                <CardDescription>Review the items added to the current bill.</CardDescription>
              </div>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Bill
              </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title / Author, Editor, Compiler, Translator</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Purchaser Name</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Unit Price (Rs.)</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Discounted Price (Rs.)</TableHead>
                  <TableHead>Total Amount (Rs.)</TableHead>
                  <TableHead className="print:hidden"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billEntries.length > 0 ? (
                  billEntries.map(entry => {
                    const { discountedPrice, totalAmount } = calculateRow(entry);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium" dir="auto">
                          {entry.bookTitle}
                          {entry.bookTitleSindhi && <div className="font-sindhi text-sm text-muted-foreground" dir="rtl">{entry.bookTitleSindhi}</div>}
                        </TableCell>
                        <TableCell>{entry.date} {entry.time}</TableCell>
                        <TableCell>
                          {entry.purchaserName}
                          {entry.purchaserNameSindhi && <div className="font-sindhi text-sm text-muted-foreground" dir="rtl">{entry.purchaserNameSindhi}</div>}
                          </TableCell>
                        <TableCell>{entry.quantity}</TableCell>
                        <TableCell>{entry.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{entry.discountPercent}%</TableCell>
                        <TableCell>{discountedPrice.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">{totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right print:hidden">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                      No entries added to the bill yet. Start by adding a new entry above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {billEntries.length > 0 && (
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="font-semibold">Summary</TableCell>
                        <TableCell className="font-semibold">{totalQuantity}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                        <TableCell className="font-bold text-primary">{overallTotal.toFixed(2)}</TableCell>
                        <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
          {billEntries.length > 0 && (
              <CardFooter className="flex justify-end">
                  <div className="text-right">
                      <p className="text-lg font-semibold">Overall Total (Rs.):</p>
                      <p className="text-2xl font-bold text-primary">{overallTotal.toFixed(2)}</p>
                  </div>
              </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Generated Bills History</CardTitle>
              <CardDescription>A record of all previously generated bills.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Purchaser Name</TableHead>
                          <TableHead>Book Title(s)</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Total Amount (Rs.)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {generatedBills.length > 0 ? (
                          generatedBills.map(bill => (
                              <TableRow key={bill.id}>
                                  <TableCell className="font-medium">{bill.id}</TableCell>
                                  <TableCell>{bill.purchaserName}</TableCell>
                                  <TableCell>
                                      {bill.entries[0]?.bookTitle}
                                      {bill.entries.length > 1 && ` (+${bill.entries.length - 1} more)`}
                                  </TableCell>
                                  <TableCell>{bill.entries[0]?.date} {bill.entries[0]?.time}</TableCell>
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
                              <TableCell colSpan={6} className="h-24 text-center">
                                  No bills have been generated yet.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Edit Bill Entry</DialogTitle>
                      <DialogDescription>
                          Make changes to the bill entry here. Click save when you're done.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-bookTitle" className="text-right">Title</Label>
                          <Input id="edit-bookTitle" value={editedEntry.bookTitle} onChange={(e) => setEditedEntry(p => ({...p, bookTitle: e.target.value}))} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-bookTitleSindhi" className="text-right font-sindhi">سنڌي عنوان</Label>
                          <Input id="edit-bookTitleSindhi" value={editedEntry.bookTitleSindhi} onChange={(e) => setEditedEntry(p => ({...p, bookTitleSindhi: e.target.value}))} className="col-span-3 font-sindhi" dir="rtl" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-purchaserName" className="text-right">Purchaser</Label>
                          <Input id="edit-purchaserName" value={editedEntry.purchaserName} onChange={(e) => setEditedEntry(p => ({...p, purchaserName: e.target.value}))} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-purchaserNameSindhi" className="text-right font-sindhi">خريدار جو نالو</Label>
                          <Input id="edit-purchaserNameSindhi" value={editedEntry.purchaserNameSindhi} onChange={(e) => setEditedEntry(p => ({...p, purchaserNameSindhi: e.target.value}))} className="col-span-3 font-sindhi" dir="rtl" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-quantity" className="text-right">Quantity</Label>
                          <Input id="edit-quantity" type="number" value={editedEntry.quantity} onChange={(e) => setEditedEntry(p => ({...p, quantity: e.target.value}))} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-unitPrice" className="text-right">Unit Price</Label>
                          <Input id="edit-unitPrice" type="number" value={editedEntry.unitPrice} onChange={(e) => setEditedEntry(p => ({...p, unitPrice: e.target.value}))} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-discountPercent" className="text-right">Discount %</Label>
                          <Input id="edit-discountPercent" type="number" value={editedEntry.discountPercent} onChange={(e) => setEditedEntry(p => ({...p, discountPercent: e.target.value}))} className="col-span-3" />
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" onClick={handleUpdateEntry}>Save changes</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

          <Dialog open={isBookEditDialogOpen} onOpenChange={setIsBookEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Book</DialogTitle>
                    <DialogDescription>
                        Make changes to the book details here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-book-title" className="text-right">Title</Label>
                        <Input id="edit-book-title" value={editedBookTitle} onChange={e => setEditedBookTitle(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-book-price" className="text-right">Unit Price</Label>
                        <Input id="edit-book-price" type="number" value={editedBookPrice} onChange={e => setEditedBookPrice(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsBookEditDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleUpdateBook}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </>
  );
}
    

    




