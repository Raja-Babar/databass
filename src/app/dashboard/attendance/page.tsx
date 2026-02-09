'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAttendance, AttendanceRecord } from '@/hooks/use-attendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AttendancePage() {
  const { user } = useAuth(); 
  const { attendanceRecords, updateAttendanceRecord, deleteAttendanceRecord } = useAttendance(); 

  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record =>
      record.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [attendanceRecords, searchQuery]);

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord({ ...record }); 
  };

  const handleSave = async () => {
    if (!editingRecord) return;

    // Fixed: Updated to match hook field names (user_id, check_in, check_out)
    await updateAttendanceRecord(editingRecord.user_id, editingRecord.date, {
        check_in: editingRecord.check_in,
        check_out: editingRecord.check_out,
        status: editingRecord.status,
    });
    setEditingRecord(null); 
  };

  const handleDelete = async (userId: string, date: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      await deleteAttendanceRecord(userId, date);
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Full Attendance Log</CardTitle>
          <CardDescription>
            View and manage all employee attendance records. 
            {isAdmin ? ' You can edit or delete records.' : ' Read-only view.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input 
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mb-4 max-w-sm"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(record => (
                <TableRow key={`${record.user_id}-${record.date}`}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    {editingRecord?.user_id === record.user_id && editingRecord?.date === record.date ? (
                      <Input 
                        type="time" 
                        step="1" // Seconds support for HH:mm:ss
                        value={editingRecord.check_in || ''}
                        onChange={e => setEditingRecord({...editingRecord, check_in: e.target.value})}
                      />
                    ) : (record.check_in || '--:--')}
                  </TableCell>
                  <TableCell>
                    {editingRecord?.user_id === record.user_id && editingRecord?.date === record.date ? (
                        <Input 
                          type="time" 
                          step="1"
                          value={editingRecord.check_out || ''}
                          onChange={e => setEditingRecord({...editingRecord, check_out: e.target.value})}
                        />
                    ) : (record.check_out || '--:--')}
                  </TableCell>
                  <TableCell>
                    {editingRecord?.user_id === record.user_id && editingRecord?.date === record.date ? (
                        <Select 
                            value={editingRecord.status}
                            onValueChange={value => setEditingRecord({...editingRecord, status: value as AttendanceRecord['status']})}
                        >
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Leave">Leave</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : record.status}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-2">
                        {editingRecord?.user_id === record.user_id && editingRecord?.date === record.date ? (
                            <Button size="sm" onClick={handleSave}>Save</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>Edit</Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(record.user_id, record.date)}>
                            Delete
                        </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}