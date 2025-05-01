import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Student, useAttendanceSession, useUpdateAttendanceRecord } from "@/hooks/use-teacher-data";
import { formatDate, formatTime } from "@/lib/date-utils";
import { Loader2, PenSquare, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface SessionDetailsProps {
  sessionId: string;
}

// Define a record type to match the structure in AttendanceSession
interface SessionRecord {
  id: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
  remark?: string;
  student: Student;
}

export function SessionDetails({ sessionId }: SessionDetailsProps) {
  const { data: session, isLoading, error, refetch } = useAttendanceSession(sessionId);
  const updateRecordMutation = useUpdateAttendanceRecord();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive">Failed to load session details</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Session not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/attendance/today">
            View Today's Sessions
          </Link>
        </Button>
      </div>
    );
  }

  const handleStatusChange = async (recordId: string, newStatus: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED") => {
    try {
      await updateRecordMutation.mutateAsync({
        recordId,
        status: newStatus
      });
      toast.success("Attendance status updated");
    } catch (error) {
      toast.error("Failed to update attendance status");
      console.error("Error updating status:", error);
    }
  };

  // Filter records based on search query and status filter
  const filteredRecords = session.records
    .filter((record: SessionRecord) => {
      const nameMatch = record.student &&
        record.student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const rollNoMatch = record.student &&
        record.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

      return (nameMatch || rollNoMatch);
    })
    .filter((record: SessionRecord) => {
      if (statusFilter === "ALL") return true;
      return record.status === statusFilter;
    });

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{session.course.name}</h2>
            <Button asChild size="sm">
              <Link href={`/dashboard/attendance/session/${sessionId}/mark`}>
                <PenSquare className="h-4 w-4 mr-2" />
                Edit Attendance
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{formatDate(session.date)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Section</span>
              <span className="font-medium">{session.section.name}</span>
            </div>
            {session.group && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">Group</span>
                <span className="font-medium">{session.group.name}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-muted-foreground">Component Type</span>
              <span className="font-medium">{session.componentType}</span>
            </div>
            {session.topic && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">Topic</span>
                <span className="font-medium">{session.topic}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="bg-card p-4 rounded-lg border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Total Students</div>
          <div className="text-xl font-bold">{session.statistics.totalStudents}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Present</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{session.statistics.presentCount}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Absent</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">{session.statistics.absentCount}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Attendance</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{session.statistics.attendancePercentage}%</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Student Attendance</h3>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/attendance/session/${sessionId}/mark`}>
              <Users className="h-4 w-4 mr-2" />
              Mark Attendance
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="LEAVE">Leave</SelectItem>
              <SelectItem value="EXCUSED">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left p-3">Roll No</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Remarks</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record: SessionRecord) => (
                  <tr key={record.id} className="border-b hover:bg-secondary/50">
                    <td className="p-3">{record.student.rollNo}</td>
                    <td className="p-3">{record.student.name}</td>
                    <td className="p-3 w-36">
                      <Select
                        value={record.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            record.id,
                            value as "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED"
                          )
                        }
                        disabled={updateRecordMutation.isPending}
                      >
                        <SelectTrigger className={
                          record.status === "PRESENT" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" :
                          record.status === "ABSENT" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" :
                          record.status === "LATE" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                          record.status === "LEAVE" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                          "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400"
                        }>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                          <SelectItem value="LEAVE">Leave</SelectItem>
                          <SelectItem value="EXCUSED">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {record.remark || "-"}
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/attendance/record/${record.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No students match your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
