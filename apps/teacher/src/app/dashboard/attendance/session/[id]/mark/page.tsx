"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { MarkAttendanceForm } from "@/components/attendance/mark-attendance-form";
import { use } from "react";

interface MarkAttendancePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MarkAttendancePage({
  params,
}: MarkAttendancePageProps) {
  const { id } = use(params);

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
