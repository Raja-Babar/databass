
export const pettyCashRecords = JSON.stringify(
  [
    { "date": "2024-07-01", "description": "Office Supplies", "amount": -55.20 },
    { "date": "2024-07-03", "description": "Team Lunch", "amount": -120.50 },
    { "date": "2024-07-05", "description": "Cash Replenishment", "amount": 500.00 },
    { "date": "2024-07-10", "description": "Courier Services", "amount": -25.00 },
    { "date": "2024-07-15", "description": "Minor IT Repair", "amount": -75.00 }
  ], null, 2
);

export const scanningProgressRecords = JSON.stringify(
  [
    {
      "book_id": "BK001",
      "file_name": "history_of_sindh.pdf",
      "title_english": "History of Sindh",
      "title_sindhi": "سنڌ جي تاريخ",
      "author_english": "Dr. Nabi Bux Baloch",
      "author_sindhi": "ڊاڪٽر نبي بخش بلوچ",
      "year": "1980",
      "language": "English",
      "link": "https://example.com/bk001",
      "status": "Uploading",
      "scanned_by": "Ali",
      "assigned_to": "Fatima",
      "uploaded_by": "Zainab",
      "source": "Institute Library",
      "created_time": "2024-07-01T10:00:00Z",
      "last_edited_time": "2024-07-29T10:00:00Z",
      "last_edited_by": "Fatima",
      "month": "July"
    },
    {
      "book_id": "BK002",
      "file_name": "sindh_through_centuries.pdf",
      "title_english": "Sindh Through Centuries",
      "title_sindhi": "صدين کان سنڌ",
      "author_english": "M.H. Panhwar",
      "author_sindhi": "ايم ايڇ پنھور",
      "year": "1996",
      "language": "English",
      "link": "https://example.com/bk002",
      "status": "PDF-QC",
      "scanned_by": "Ahmed",
      "assigned_to": "Fatima",
      "uploaded_by": null,
      "source": "Personal Collection",
      "created_time": "2024-07-02T11:30:00Z",
      "last_edited_time": "2024-07-29T11:30:00Z",
      "last_edited_by": "Fatima",
      "month": "July"
    },
    {
      "book_id": "BK003",
      "file_name": "panhwar_contributions.pdf",
      "title_english": "Panhwar Contributions",
      "title_sindhi": "پنهور جو حصو",
      "author_english": "Various",
      "author_sindhi": "مختلف",
      "year": "2005",
      "language": "Sindhi",
      "link": "https://example.com/bk003",
      "status": "Scanning",
      "scanned_by": "Bilal",
      "assigned_to": "Bilal",
      "uploaded_by": null,
      "source": "Institute Library",
      "created_time": "2024-07-03T09:15:00Z",
      "last_edited_time": "2024-07-29T09:15:00Z",
      "last_edited_by": "Bilal",
      "month": "July"
    },
    {
      "book_id": "BK004",
      "file_name": "indus_valley.pdf",
      "title_english": "Indus Valley Civilization",
      "title_sindhi": "سنڌو ماٿري جي تهذيب",
      "author_english": "Sir Mortimer Wheeler",
      "author_sindhi": "سر مورٽيمر ويلر",
      "year": "1968",
      "language": "English",
      "link": "https://example.com/bk004",
      "status": "Completed",
      "scanned_by": "Ali",
      "assigned_to": "Zainab",
      "uploaded_by": "Zainab",
      "source": "Archive",
      "created_time": "2024-06-20T16:45:00Z",
      "last_edited_time": "2024-07-28T16:45:00Z",
      "last_edited_by": "Zainab",
      "month": "June"
    }
  ], null, 2
);

export const employeeReports = [
  {
    id: 'REP-001',
    employeeId: 'EMP101',
    employeeName: 'Employee User',
    submittedDate: '2024-07-29',
    submittedTime: '10:30 AM',
    stage: 'Completed',
    type: 'Pages',
    quantity: 250,
  },
  {
    id: 'REP-002',
    employeeId: 'EMP001',
    employeeName: 'Ali Khan',
    submittedDate: '2024-07-28',
    submittedTime: '02:45 PM',
    stage: 'PDF Uploading',
    type: 'Pages',
    quantity: 180,
  },
  {
    id: 'REP-003',
    employeeId: 'EMP003',
    employeeName: 'Fatima Ali',
    submittedDate: '2024-07-27',
    submittedTime: '11:00 AM',
    stage: 'Scanning',
    type: 'Books',
    quantity: 5,
  },
  {
    id: 'REP-004',
    employeeId: 'EMP004',
    employeeName: 'Zainab Omar',
    submittedDate: '2024-07-26',
    submittedTime: '04:15 PM',
    stage: 'PDF Q-C',
    type: 'Pages',
    quantity: 300,
  },
  {
    id: 'REP-005',
    employeeId: 'EMP101',
    employeeName: 'Employee User',
    submittedDate: '2024-07-25',
    submittedTime: '09:55 AM',
    stage: 'Scanning Q-C',
    type: 'Books',
    quantity: 2,
  },
  {
    id: 'REP-006',
    employeeId: 'EMP101',
    employeeName: 'Employee User',
    submittedDate: '2024-06-15',
    submittedTime: '03:20 PM',
    stage: 'PDF Pages',
    type: 'Books',
    quantity: 1,
  }
];

// Corresponds to the default users in auth-provider.tsx
export const attendanceRecords = [
  // Admin User records for today
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-29', timeIn: '09:00 AM', timeOut: '05:00 PM', status: 'Present' },

  // Employee User records for today
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-29', timeIn: '09:15 AM', timeOut: '05:15 PM', status: 'Present' },

  // Other employee records for today
  { employeeId: 'EMP002', name: 'Ahmed Raza', date: '2024-07-29', timeIn: '09:02 AM', timeOut: '05:02 PM', status: 'Present' },
  { employeeId: 'EMP003', name: 'Fatima Ali', date: '2024-07-29', timeIn: '--:--', timeOut: '--:--', status: 'Absent' },
  { employeeId: 'EMP004', name: 'Zainab Omar', date: '2024-07-29', timeIn: '09:30 AM', timeOut: '05:30 PM', status: 'Present' },
  { employeeId: 'EMP005', name: 'Bilal Ahmed', date: '2024-07-29', timeIn: '--:--', timeOut: '--:--', status: 'Leave' },
  { employeeId: 'EMP006', name: 'Sana Javed', date: '2024-07-29', timeIn: '08:55 AM', timeOut: '04:55 PM', status: 'Present' },
  { employeeId: 'EMP007', name: 'Umar Farooq', date: '2024-07-29', timeIn: '09:10 AM', timeOut: '05:10 PM', status: 'Present' },

  // Previous days' records for chart data
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-28', timeIn: '09:01 AM', timeOut: '05:01 PM', status: 'Present' },
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-27', timeIn: '09:03 AM', timeOut: '05:03 PM', status: 'Present' },
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-26', timeIn: '08:58 AM', timeOut: '04:58 PM', status: 'Present' },
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-25', timeIn: '--:--', timeOut: '--:--', status: 'Absent' },
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2024-07-24', timeIn: '09:05 AM', timeOut: '05:05 PM', status: 'Present' },
  
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-28', timeIn: '09:12 AM', timeOut: '05:12 PM', status: 'Present' },
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-27', timeIn: '--:--', timeOut: '--:--', status: 'Leave' },
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-26', timeIn: '09:18 AM', timeOut: '05:18 PM', status: 'Present' },
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-25', timeIn: '09:11 AM', timeOut: '05:11 PM', status: 'Present' },
  { employeeId: 'EMP101', name: 'Employee User', date: '2024-07-24', timeIn: '09:09 AM', timeOut: '05:09 PM', status: 'Present' },
  
  { employeeId: 'EMP002', name: 'Ahmed Raza', date: '2024-07-28', timeIn: '09:03 AM', timeOut: '05:03 PM', status: 'Present' },
  { employeeId: 'EMP003', name: 'Fatima Ali', date: '2024-07-28', timeIn: '--:--', timeOut: '--:--', status: 'Absent' },
  
  { employeeId: 'EMP002', name: 'Ahmed Raza', date: '2024-07-27', timeIn: '09:01 AM', timeOut: '05:01 PM', status: 'Present' },
  { employeeId: 'EMP003', name: 'Fatima Ali', date: '2024-07-27', timeIn: '08:59 AM', timeOut: '04:59 PM', status: 'Present' },

  // Data for 2023
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2023-07-29', timeIn: '09:00 AM', timeOut: '05:00 PM', status: 'Present' },
  { employeeId: 'EMP002', name: 'Ahmed Raza', date: '2023-07-29', timeIn: '09:05 AM', timeOut: '05:05 PM', status: 'Present' },
  { employeeId: 'EMP001', name: 'Ali Khan', date: '2023-07-28', timeIn: '09:02 AM', timeOut: '05:02 PM', status: 'Present' },

  // Data for 2025
  { employeeId: 'EMP003', name: 'Fatima Ali', date: '2025-01-15', timeIn: '09:00 AM', timeOut: '05:00 PM', status: 'Present' },
  { employeeId: 'EMP004', name: 'Zainab Omar', date: '2025-01-15', timeIn: '--:--', timeOut: '--:--', status: 'Leave' },
  { employeeId: 'EMP003', name: 'Fatima Ali', date: '2025-01-16', timeIn: '09:05 AM', timeOut: '05:05 PM', status: 'Present' },
];

    
