"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { AttendanceSessionList } from "@/components/attendance/attendance-session-list";
import { AttendanceStatsCards } from "@/components/attendance/attendance-stats-cards";
import { Button } from "@/components/ui/button";
import { ApiService } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, startOfMonth } from "date-fns";
import { BarChart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AttendancePage() {
  // Current date range defaults to current month
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // Fetch attendance sessions in date range
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["attendanceSessions", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const response = await ApiService.getAttendanceSessionsByDateRange(startDate, endDate);
      return response.data;
    },
  });

  const headerActions = (
    <>
      <Button asChild variant="outline">
        <Link href="/dashboard/attendance/reports">
          <BarChart className="h-4 w-4 mr-2" />
          Reports
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Attendance Management"
        description="Create and manage attendance sessions for your classes"
        showCreateButton
        actions={headerActions}
      />

      {/* Quick actions cards */}
      <AttendanceStatsCards sessions={sessions} isLoading={isLoading} />

      {/* Sessions list */}
      <AttendanceSessionList sessions={sessions} isLoading={isLoading} />
    </div>
  );
}
