"use client";

import { AttendanceError } from "@/components/attendance/attendance-error";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { AttendanceLoading } from "@/components/attendance/attendance-loading";
import { AttendanceSessionCard } from "@/components/attendance/attendance-session-card";
import { EmptyAttendance } from "@/components/attendance/empty-attendance";
import { useTodaySessions } from "@/hooks/use-teacher-data";

export default function TodayAttendancePage() {
  // Use the hook to fetch today's attendance sessions
  const { data: sessions, isLoading, error, refetch } = useTodaySessions();

  if (isLoading) {
    return <AttendanceLoading />;
  }

  if (error) {
    return <AttendanceError onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Today's Attendance"
        description="View and manage today's attendance sessions"
      />

      <div className="grid gap-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <AttendanceSessionCard key={session.id} session={session} />
          ))
        ) : (
          <EmptyAttendance />
        )}
      </div>
    </div>
  );
}
