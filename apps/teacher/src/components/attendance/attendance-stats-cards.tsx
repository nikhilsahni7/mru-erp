import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceSession } from "@/hooks/use-teacher-data";
import { useMutation } from "@tanstack/react-query";
import { isToday, parseISO } from "date-fns";
import { ChevronRight, ClipboardList, FileDown, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AttendanceStatsCardsProps {
  sessions: AttendanceSession[] | undefined;
  isLoading: boolean;
}

export function AttendanceStatsCards({ sessions, isLoading }: AttendanceStatsCardsProps) {
  // Export attendance data (mock functionality)
  const exportAttendance = useMutation({
    mutationFn: async () => {
      // This would normally call an API endpoint to generate a report
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Attendance report exported successfully");
    },
    onError: () => {
      toast.error("Failed to export attendance report");
    },
  });

  const todaySessions = sessions?.filter(s => isToday(parseISO(s.date))) || [];
  const averageAttendance = sessions && sessions.length > 0
    ? Math.round(
        sessions.reduce(
          (sum, session) => sum + session.statistics.attendancePercentage,
          0
        ) / sessions.length
      )
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
          <CardDescription>Sessions for today</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="text-2xl font-bold">
            {todaySessions.length}
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/attendance/today">
              View <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <CardDescription>Total sessions this month</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="text-2xl font-bold">{sessions?.length || 0}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportAttendance.mutate()}
            disabled={exportAttendance.isPending}
          >
            {exportAttendance.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Export <FileDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
          <CardDescription>This month's average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageAttendance}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
          <CardDescription>Common actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button size="sm" variant="outline" asChild className="justify-start">
            <Link href="/dashboard/attendance/create">
              <ClipboardList className="mr-2 h-4 w-4" />
              Create Session
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="justify-start">
            <Link href="/dashboard/attendance/reports">
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
