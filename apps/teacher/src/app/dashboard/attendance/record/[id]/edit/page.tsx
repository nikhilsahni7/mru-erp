"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { EditAttendanceRecordForm } from "@/components/attendance/edit-attendance-record-form";

interface EditAttendanceRecordPageProps {
  params: {
    id: string;
  };
}

export default function EditAttendanceRecordPage({ params }: EditAttendanceRecordPageProps) {
  // For Next.js compatibility, we'll use direct access for now
  const { id } = params;

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Edit Attendance Record"
        description="Update a student's attendance status and remarks"
        showBackButton
      />

      <EditAttendanceRecordForm recordId={id} />
    </div>
  );
}
