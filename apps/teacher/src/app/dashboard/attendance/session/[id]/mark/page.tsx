"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { MarkAttendanceForm } from "@/components/attendance/mark-attendance-form";

interface MarkAttendancePageProps {
  params: {
    id: string;
  };
}

export default function MarkAttendancePage({ params }: MarkAttendancePageProps) {
  // For Next.js compatibility, we'll use direct access for now
  const { id } = params;

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Mark Attendance"
        description="Update student attendance records for this session"
        showBackButton
        backHref={`/dashboard/attendance/session/${id}`}
      />

      <MarkAttendanceForm sessionId={id} />
    </div>
  );
}
