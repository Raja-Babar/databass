
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Printer, FileDown, Trash2, PlusCircle, Edit, Download, Camera, MoreHorizontal, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import html2canvas from 'html2canvas';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';


type TableRowData = {
    id: number;
    sno: string;
    items: string;
    quantity: string;
};

type GeneratedLetter = {
    id: string;
    type: 'PDF' | 'Image';
    recipientPrefix: string;
    recipientName: string;
    subject: string;
    date: string;
    referenceNo: string;
    letterHeading: string;
    letterHeadingSindhi: string;
    recipientNameSindhi: string;
    recipientDesignation: string;
    recipientDesignationSindhi: string;
    departmentAddress: string;
    departmentAddressSindhi: string;
    subjectSindhi: string;
    body: string;
    bodySindhi: string;
    closing: string;
    closingSindhi: string;
    senderName: string;
    senderNameSindhi: string;
    senderDesignation: string;
    senderDesignationSindhi: string;
    tableRows: TableRowData[];
    logo: string;
};

export default function CorrespondencePage() {
    const { toast } = useToast();
    const { appLogo, updateAppLogo } = useAuth();
    const [referenceNo, setReferenceNo] = useState('MHPISSJ/');
    const [letterHeading, setLetterHeading] = useState('');
    const [recipientPrefix, setRecipientPrefix] = useState('To');
    const [recipientName, setRecipientName] = useState('');
    const [recipientDesignation, setRecipientDesignation] = useState('');
    const [departmentAddress, setDepartmentAddress] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [closing, setClosing] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderDesignation, setSenderDesignation] = useState('');

    const [letterHeadingSindhi, setLetterHeadingSindhi] = useState('');
    const [recipientNameSindhi, setRecipientNameSindhi] = useState('');
    const [recipientDesignationSindhi, setRecipientDesignationSindhi] = useState('');
    const [departmentAddressSindhi, setDepartmentAddressSindhi] = useState('');
    const [subjectSindhi, setSubjectSindhi] = useState('');
    const [bodySindhi, setBodySindhi] = useState('');
    const [closingSindhi, setClosingSindhi] = useState('');
    const [senderNameSindhi, setSenderNameSindhi] = useState('');
    const [senderDesignationSindhi, setSenderDesignationSindhi] = useState('');
    
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    const [generatedLetters, setGeneratedLetters] = useState<GeneratedLetter[]>([]);
    
    const [tableRows, setTableRows] = useState<TableRowData[]>([]);
    const [nextTableRowId, setNextTableRowId] = useState(1);
    const [newItems, setNewItems] = useState('');
    const [newQuantity, setNewQuantity] = useState('');


    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const letterPreviewRef = useRef<HTMLDivElement>(null);
    
     const generateTableHTML = (rows: TableRowData[]) => {
        if (rows.length === 0) return '';
        const headers = `
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">S.No</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Items</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Quantity</th>
                </tr>
            </thead>
        `;
        const body = rows.map(row => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.sno}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.items}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.quantity}</td>
            </tr>
        `).join('');

        return `<table style="width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1.5rem;">${headers}<tbody>${body}</tbody></table>`;
    };
    
    const generatePDF = async (letterData: GeneratedLetter | null = null, silent = false) => {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4',
        });
        
        const pdfWidth = doc.internal.pageSize.getWidth() - 80;

        const data = letterData || {
            referenceNo,
            letterHeading, letterHeadingSindhi, recipientPrefix, recipientName, recipientNameSindhi,
            recipientDesignation, recipientDesignationSindhi, departmentAddress, departmentAddressSindhi,
            subject, subjectSindhi, body, bodySindhi, closing, closingSindhi,
            senderName, senderNameSindhi, senderDesignation, senderDesignationSindhi,
            date: todayDate,
            id: `LETTER-${Date.now()}`,
            tableRows,
            type: 'PDF' as const,
            logo: appLogo,
        };

        const hasTable = data.tableRows.length > 0;
        
        const sindhiSubjectContent = data.subjectSindhi ? `<p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem; font-weight: bold; text-decoration: underline; text-align: right;" dir="rtl">مضمون: ${data.subjectSindhi}</p>` : '';

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${pdfWidth}pt`;
        tempContainer.style.fontFamily = 'serif';
        tempContainer.style.lineHeight = '1.5';
        tempContainer.style.wordWrap = 'break-word';
        
        const pdfContentHTML = `
            <div style="text-align: right; margin-bottom: 1rem;">
                <img src="${data.logo}" alt="MHPISSJ-Portal Logo" style="width: 80px; height: 80px;"/>
            </div>
            <div style="text-align: center; font-weight: bold; font-size: 1.25rem; margin-bottom: 1.5rem;">
                <p>${data.letterHeading.replace(/\n/g, '<br />')}</p>
                <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.5rem;">${data.letterHeadingSindhi.replace(/\n/g, '<br />')}</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                <span>Ref: ${data.referenceNo}</span>
                <span>Date: ${data.date}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <p>${data.recipientPrefix},</p>
                <p style="margin-top: 0.5rem; white-space: pre-wrap;">${data.recipientName.replace(/\n/g, '<br />')}</p>
                <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem; white-space: pre-wrap;" dir="rtl">${data.recipientNameSindhi.replace(/\n/g, '<br />')}</p>
                <p style="margin-top: 0.5rem; white-space: pre-wrap;">${data.recipientDesignation.replace(/\n/g, '<br />')}</p>
                <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem; white-space: pre-wrap;" dir="rtl">${data.recipientDesignationSindhi.replace(/\n/g, '<br />')}</p>
                <p style="margin-top: 0.5rem; white-space: pre-wrap;">${data.departmentAddress.replace(/\n/g, '<br />')}</p>
                <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem; white-space: pre-wrap;" dir="rtl">${data.departmentAddressSindhi.replace(/\n/g, '<br />')}</p>
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="font-weight: bold; text-decoration: underline;">Subject: ${data.subject}</p>
                ${sindhiSubjectContent}
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="white-space: pre-wrap;">${data.body.replace(/\n/g, '<br />')}</p>
                <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem; margin-top: 0.5rem; text-align: right; white-space: pre-wrap;" dir="rtl">${data.bodySindhi.replace(/\n/g, '<br />')}</p>
            </div>
             ${!hasTable ? `
                <div style="margin-top: 2rem;">
                    <p>${data.closing}</p>
                    <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem;">${data.closingSindhi}</p>
                    <p style="margin-top: 1rem;">${data.senderName}</p>
                    <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem;">${data.senderNameSindhi}</p>
                    <p>${data.senderDesignation}</p>
                    <p style="font-family: 'MB Lateefi', sans-serif; font-size: 1.125rem;">${data.senderDesignationSindhi}</p>
                </div>` : ''}
        `;
        
        tempContainer.innerHTML = pdfContentHTML;
        document.body.appendChild(tempContainer);

        await doc.html(tempContainer, {
            autoPaging: 'text',
            x: 40,
            y: 40,
            width: pdfWidth,
            windowWidth: pdfWidth,
            html2canvas: {
                useCORS: true, // Allow fetching cross-origin images
            },
            callback: async (doc) => {
                if (hasTable) {
                    const tableHTML = generateTableHTML(data.tableRows);
                    const tableContainer = document.createElement('div');
                    tableContainer.innerHTML = tableHTML;
                    const tableElement = tableContainer.querySelector('table');
                    
                    if (tableElement) {
                        autoTable(doc, { html: tableElement, startY: doc.autoTable.previous.finalY + 10, margin: { left: 40 } });
                    }
                    
                    const closingY = doc.autoTable.previous.finalY + 30;

                    doc.setFont('times', 'normal');
                    doc.setFontSize(12);
                    doc.text(data.closing, 40, closingY);
                    doc.text(data.senderName, 40, closingY + 30);
                    doc.text(data.senderDesignation, 40, closingY + 45);
                    
                    doc.addFont('/MB-Lateefi.ttf', 'MB Lateefi', 'normal');
                    doc.setFont('MB Lateefi');
                    doc.setFontSize(14); // 1.125rem approx
                    doc.text(data.closingSindhi, doc.internal.pageSize.getWidth() - 40, closingY, { align: 'right' });
                    doc.text(data.senderNameSindhi, doc.internal.pageSize.getWidth() - 40, closingY + 30, { align: 'right' });
                    doc.text(data.senderDesignationSindhi, doc.internal.pageSize.getWidth() - 40, closingY + 45, { align: 'right' });
                }

                document.body.removeChild(tempContainer);
                
                if (!silent) {
                    doc.save(`Official_Letter_${(data.recipientName || 'Generated').replace(/\s+/g, '_')}.pdf`);
                }
            }
        });

        if (!letterData) { // Only add to history if it's a new letter
            setGeneratedLetters(prev => [data, ...prev]);
            if (!silent) {
                toast({
                    title: 'Letter Saved & Exported',
                    description: 'The letter has been saved to history and exported as a PDF.',
                });
            }
        } else if (!silent) {
            toast({
                title: 'PDF Exported',
                description: 'The historical letter has been exported as a PDF.',
            });
        }
    };


    const handleDeleteLetter = (id: string) => {
        setGeneratedLetters(prev => prev.filter(letter => letter.id !== id));
        toast({
            title: 'Letter Deleted',
            description: 'The letter has been removed from the history.',
        });
    };

    const printLetter = () => {
        const printContent = letterPreviewRef.current?.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Letter</title>');
            printWindow.document.write('<style> body { font-family: sans-serif; } .sindhi { font-family: "MB Lateefi", sans-serif; direction: rtl; text-align: right; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 8px; text-align: left; } </style>');
            printWindow.document.write('</head><body >');
            printWindow.document.write(printContent || '');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };
    
    const handleAddTableRow = () => {
        if (!newItems || !newQuantity) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all fields for the table row.' });
            return;
        }
        const newSno = (tableRows.length + 1).toString();
        setTableRows(prev => [...prev, { id: nextTableRowId, sno: newSno, items: newItems, quantity: newQuantity }]);
        setNextTableRowId(prev => prev + 1);
        setNewItems('');
        setNewQuantity('');
    };

    const handleDeleteTableRow = (id: number) => {
        setTableRows(prev => prev.filter(row => row.id !== id).map((row, index) => ({ ...row, sno: (index + 1).toString() })));
    };

    const generateImage = async (letterData: GeneratedLetter | null = null, silent = false) => {
        const data = letterData || {
            referenceNo,
            letterHeading, letterHeadingSindhi, recipientPrefix, recipientName, recipientNameSindhi,
            recipientDesignation, recipientDesignationSindhi, departmentAddress, departmentAddressSindhi,
            subject, subjectSindhi, body, bodySindhi, closing, closingSindhi,
            senderName, senderNameSindhi, senderDesignation, senderDesignationSindhi,
            date: todayDate,
            id: `IMAGE-${Date.now()}`,
            tableRows,
            type: 'Image' as const,
            logo: appLogo,
        };

        const previewElement = letterPreviewRef.current;
        if (!previewElement) {
             toast({ variant: 'destructive', title: 'Image Generation Failed', description: 'Could not find the preview element.' });
            return;
        }

        const tempRenderDiv = previewElement.cloneNode(true) as HTMLDivElement;
        tempRenderDiv.style.position = 'absolute';
        tempRenderDiv.style.left = '-9999px';
        tempRenderDiv.style.width = '794px'; // A4 width at 96 DPI
        tempRenderDiv.style.wordWrap = 'break-word';
        tempRenderDiv.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(tempRenderDiv);

        try {
            const canvas = await html2canvas(tempRenderDiv, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            
            if (!silent) {
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'px',
                    format: 'a4',
                });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 0;

                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save(`Letter_Image_${Date.now()}.pdf`);
            }
            
            if (!letterData) { // Only add to history if it's a new letter
                setGeneratedLetters(prev => [data, ...prev]);
                if (!silent) {
                    toast({
                        title: 'Image Exported & Saved',
                        description: 'The letter has been saved to history and downloaded as a PDF with the image.',
                    });
                }
            } else if (!silent) {
                 toast({
                    title: 'Image Exported',
                    description: 'The historical letter has been downloaded as an image in a PDF.',
                });
            }
        } catch(err) {
            toast({ variant: 'destructive', title: 'Image Generation Failed', description: 'Could not generate image.' });
        } finally {
             document.body.removeChild(tempRenderDiv);
        }
    };

  const handleDownload = (letter: GeneratedLetter) => {
    if (letter.type === 'PDF') {
      generatePDF(letter, false);
    } else {
      generateImage(letter, false);
    }
  };
  
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newLogo = reader.result as string;
                updateAppLogo(newLogo);
                toast({
                    title: 'Logo Updated',
                    description: 'The application logo has been updated and set as default.',
                });
            };
            reader.readAsDataURL(file);
        }
    };


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Correspondence with Government Officials</h1>
            <p className="text-muted-foreground mt-2">Create and manage official correspondence.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Compose Letter</CardTitle>
                        <CardDescription>Fill in the details to generate an official letter.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                    </Button>
                    <input
                        type="file"
                        ref={logoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                    />
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="referenceNo">Reference No.</Label>
                        <Input id="referenceNo" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="e.g., MHPISSJ/" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="letterHeading">Letter Heading / Title</Label>
                            <Input id="letterHeading" value={letterHeading} onChange={e => setLetterHeading(e.target.value)} placeholder="e.g., OFFICIAL COMMUNIQUE" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="letterHeadingSindhi" className="font-sindhi text-lg float-right">خط جي عنوان</Label>
                            <Input id="letterHeadingSindhi" value={letterHeadingSindhi} onChange={e => setLetterHeadingSindhi(e.target.value)} placeholder="مثال طور، سرڪاري پڌرائي" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Recipient Prefix</Label>
                        <Select onValueChange={setRecipientPrefix} defaultValue={recipientPrefix}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a prefix" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="To">To</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Recipient Name</Label>
                            <Textarea id="recipientName" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g., Dr. John Doe" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="recipientNameSindhi" className="font-sindhi text-lg float-right">وصول ڪندڙ جو نالو</Label>
                            <Textarea id="recipientNameSindhi" value={recipientNameSindhi} onChange={e => setRecipientNameSindhi(e.target.value)} placeholder="مثال طور، ڊاڪٽر جان ڊو" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipientDesignation">Recipient's Designation</Label>
                            <Textarea id="recipientDesignation" value={recipientDesignation} onChange={e => setRecipientDesignation(e.target.value)} placeholder="e.g., Director General" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="recipientDesignationSindhi" className="font-sindhi text-lg float-right">عھدو</Label>
                            <Textarea id="recipientDesignationSindhi" value={recipientDesignationSindhi} onChange={e => setRecipientDesignationSindhi(e.target.value)} placeholder="مثال طور، ڊائريڪٽر جنرل" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="departmentAddress">Department / Office Address</Label>
                            <Textarea id="departmentAddress" value={departmentAddress} onChange={e => setDepartmentAddress(e.target.value)} placeholder="e.g., Department of Archives, Karachi" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="departmentAddressSindhi" className="font-sindhi text-lg float-right">کاتو / آفيس جو پتو</Label>
                            <Textarea id="departmentAddressSindhi" value={departmentAddressSindhi} onChange={e => setDepartmentAddressSindhi(e.target.value)} placeholder="مثال طور، آرڪائيو کاتو، ڪراچي" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Request for Archival Access" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subjectSindhi" className="font-sindhi text-lg float-right">مضمون</Label>
                            <Input id="subjectSindhi" value={subjectSindhi} onChange={e => setSubjectSindhi(e.target.value)} placeholder="آرڪائيو رسائي جي درخواست" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                    
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="body">Body Text</Label>
                                <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder="Dear Sir/Madam..." rows={8} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bodySindhi" className="font-sindhi text-lg float-right">خط جو متن</Label>
                                <Textarea id="bodySindhi" value={bodySindhi} onChange={e => setBodySindhi(e.target.value)} placeholder="جناب/محترمه..." rows={8} className="font-sindhi" dir="rtl" />
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Table Content</CardTitle>
                                <CardDescription>Optionally, add a table to your letter body.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Items" value={newItems} onChange={e => setNewItems(e.target.value)} />
                                    <Input placeholder="Quantity" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} />
                                </div>
                                <Button size="sm" className="mt-2" onClick={handleAddTableRow}><PlusCircle className="mr-2 h-4 w-4" /> Add Row</Button>
                                
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>S.No</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tableRows.map(row => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.sno}</TableCell>
                                                <TableCell>{row.items}</TableCell>
                                                <TableCell>{row.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTableRow(row.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tableRows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No items added to the table.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing">Closing/Regards</Label>
                            <Input id="closing" value={closing} onChange={e => setClosing(e.target.value)} placeholder="Sincerely" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="closingSindhi" className="font-sindhi text-lg float-right">نيڪ تمنائون</Label>
                            <Input id="closingSindhi" value={closingSindhi} onChange={e => setClosingSindhi(e.target.value)} placeholder="مخلص" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="senderName">Sender Name</Label>
                            <Input id="senderName" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g., M.H. Panhwar" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="senderNameSindhi" className="font-sindhi text-lg float-right">موڪليندڙ جو نالو</Label>
                            <Input id="senderNameSindhi" value={senderNameSindhi} onChange={e => setSenderNameSindhi(e.target.value)} placeholder="مثال طور، ايم ايڇ پنهور" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="senderDesignation">Sender's Designation</Label>
                            <Input id="senderDesignation" value={senderDesignation} onChange={e => setSenderDesignation(e.target.value)} placeholder="e.g., Chairman" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="senderDesignationSindhi" className="font-sindhi text-lg float-right">موڪليندڙ جو عھدو</Label>
                            <Input id="senderDesignationSindhi" value={senderDesignationSindhi} onChange={e => setSenderDesignationSindhi(e.target.value)} placeholder="مثال طور، چيئرمين" className="font-sindhi" dir="rtl" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Letter Preview</CardTitle>
                        <CardDescription>This is how your letter will look.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="ml-2">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => generateImage()}>
                                <Camera className="mr-2 h-4 w-4" />
                                Export as Image
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={printLetter}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generatePDF()}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export & Save
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <div ref={letterPreviewRef} className="bg-white text-black p-8 rounded-md shadow-lg font-serif">
                        <div className="text-right mb-4">
                          <img src={appLogo} alt="MHPISSJ-Portal Logo" style={{ width: '80px', height: '80px', display: 'inline-block' }} />
                        </div>
                        <div className="text-center font-bold text-xl mb-6">
                            <p>{letterHeading.replace(/\n/g, '<br />')}</p>
                            <p className="font-sindhi text-2xl">{letterHeadingSindhi.replace(/\n/g, '<br />')}</p>
                        </div>
                        <div className="flex justify-between mb-6">
                            <span>Ref: {referenceNo}</span>
                            <span>Date: {todayDate}</span>
                        </div>
                        <div className="mb-4">
                            <p>{recipientPrefix},</p>
                            <p className="mt-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: recipientName.replace(/\n/g, '<br />') }} />
                            <p className="font-sindhi text-lg whitespace-pre-wrap" dir="rtl" dangerouslySetInnerHTML={{ __html: recipientNameSindhi.replace(/\n/g, '<br />') }} />
                            <p className="mt-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: recipientDesignation.replace(/\n/g, '<br />') }} />
                            <p className="font-sindhi text-lg whitespace-pre-wrap" dir="rtl" dangerouslySetInnerHTML={{ __html: recipientDesignationSindhi.replace(/\n/g, '<br />') }} />
                            <p className="mt-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: departmentAddress.replace(/\n/g, '<br />') }} />
                            <p className="font-sindhi text-lg whitespace-pre-wrap" dir="rtl" dangerouslySetInnerHTML={{ __html: departmentAddressSindhi.replace(/\n/g, '<br />') }} />
                        </div>
                        <div className="mb-4">
                            <p className="font-bold underline">Subject: {subject}</p>
                            {subjectSindhi && (
                                <p className="font-sindhi text-lg font-bold underline" dir="rtl">مضمون: {subjectSindhi}</p>
                            )}
                        </div>
                        
                        {body && (
                            <div className="mb-4">
                                <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br />') }} />
                                <p className="font-sindhi text-lg mt-2 whitespace-pre-wrap" dir="rtl" dangerouslySetInnerHTML={{ __html: bodySindhi.replace(/\n/g, '<br />') }} />
                            </div>
                        )}

                        {tableRows.length > 0 && (
                            <div dangerouslySetInnerHTML={{ __html: generateTableHTML(tableRows) }} />
                        )}

                        <div className="mt-8">
                            <p>{closing}</p>
                            <p className="font-sindhi text-lg">{closingSindhi}</p>
                            <p className="mt-4">{senderName}</p>
                            <p className="font-sindhi text-lg">{senderNameSindhi}</p>
                            <p>{senderDesignation}</p>
                            <p className="font-sindhi text-lg">{senderDesignationSindhi}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Generated Letters History</CardTitle>
                <CardDescription>A record of all previously generated and saved letters.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {generatedLetters.length > 0 ? (
                            generatedLetters.map((letter) => (
                                <TableRow key={letter.id}>
                                    <TableCell>{letter.date}</TableCell>
                                    <TableCell className="font-medium">{letter.recipientName}</TableCell>
                                    <TableCell>{letter.subject}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(letter)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download {letter.type}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLetter(letter.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No letters have been generated yet.
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
