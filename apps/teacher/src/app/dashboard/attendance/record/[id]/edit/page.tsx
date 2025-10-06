"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { EditAttendanceRecordForm } from "@/components/attendance/edit-attendance-record-form";
import { use } from "react";

interface EditAttendanceRecordPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditAttendanceRecordPage({
  params,
}: EditAttendanceRecordPageProps) {
  const { id } = use(params);

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
