import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AttendanceRecord,
  Student,
  useAttendanceSession,
  useMarkAttendance
} from "@/hooks/use-teacher-data";
import { formatDate, formatTime } from "@/lib/date-utils";
import {
  Check,
  Loader2,
  Save,
  Search,
  Users,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface MarkAttendanceFormProps {
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

export function MarkAttendanceForm({ sessionId }: MarkAttendanceFormProps) {
  const router = useRouter();
  const { data: session, isLoading, error } = useAttendanceSession(sessionId);
  const markAttendanceMutation = useMarkAttendance();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: {
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
      remark?: string;
    };
  }>({});

  // Get current status for a student
  const getStatus = (studentId: string): "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED" => {
    if (!session) return "ABSENT";

    if (attendanceRecords[studentId]) {
      return attendanceRecords[studentId].status;
    }
    // Find the student's record in the session
    const record = session.records.find((r: SessionRecord) => r.studentId === studentId);
    return record?.status || "ABSENT"; // Default to ABSENT if no record exists
  };

  // Filter students by search query and status
  // Move useMemo before conditional returns to maintain hooks order
  const filteredStudents = useMemo(() => {
    if (!session) return [];

    // First get all students from the session's records
    let students = session.records
      .filter((record: SessionRecord) => record?.student && record.student.id)
      .map((record: SessionRecord) => record.student);

    // De-duplicate students by ID (in case there are duplicates)
    const uniqueStudents = Array.from(
      new Map(students.map((s: Student) => [s.id, s])).values()
    ) as Student[];

    // Apply search filter
    let filtered = uniqueStudents;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((student: Student) => {
        return student.name.toLowerCase().includes(query) ||
               student.rollNo.toLowerCase().includes(query);
      });
    }

    // Apply status filter if selected
    if (statusFilter) {
      filtered = filtered.filter((student: Student) => {
        const status = getStatus(student.id);
        return status === statusFilter;
      });
    }

    return filtered;
  }, [session, searchQuery, statusFilter, attendanceRecords]);

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED") => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      }
    }));
    setHasChanges(true);
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark,
      }
    }));
    setHasChanges(true);
  };

  // Toggle present status for a student
  const togglePresent = (studentId: string, isChecked: boolean) => {
    handleStatusChange(studentId, isChecked ? "PRESENT" : "ABSENT");
  };

  // Mark all visible students with a specific status
  const markAllWithStatus = (status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED") => {
    if (!filteredStudents.length) return;

    const newRecords = { ...attendanceRecords };

    filteredStudents.forEach((student: Student) => {
      newRecords[student.id] = {
        ...newRecords[student.id],
        status
      };
    });

    setAttendanceRecords(newRecords);
    setHasChanges(true);
    toast.success(`Marked ${filteredStudents.length} students as ${status.toLowerCase()}`);
  };

  const handleSubmit = async () => {
    if (!session) return;

    try {
      // Convert the records to an array format for the API
      const recordsArray: AttendanceRecord[] = session.records
        .filter((record: SessionRecord) => record.student)
        .map((record: SessionRecord) => {
          const studentUpdate = attendanceRecords[record.student.id];
          return {
            studentId: record.student.id,
            status: studentUpdate?.status || record.status || "PRESENT",
            remark: studentUpdate?.remark !== undefined ? studentUpdate.remark : record.remark
          };
        });

      await markAttendanceMutation.mutateAsync({
        sessionId,
        attendanceRecords: recordsArray
      });

      toast.success("Attendance marked successfully");
      router.push(`/dashboard/attendance/session/${sessionId}`);
    } catch (error) {
      toast.error("Failed to mark attendance");
      console.error("Error marking attendance:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading attendance session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive">Failed to load attendance session</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="text-destructive">Attendance session not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/attendance/today")}>
          View Today's Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{session.course.name}</h2>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <div>Date: {formatDate(session.date)}</div>
            <div>Time: {formatTime(session.startTime)} - {formatTime(session.endTime)}</div>
            <div>Section: {session.section.name}</div>
            {session.group && <div>Group: {session.group.name}</div>}
            <div>Type: {session.componentType}</div>
          </div>
          {session.topic && (
            <div className="text-sm">
              <span className="font-medium">Topic:</span> {session.topic}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2 rounded-lg bg-secondary">
          <div className="text-sm font-medium text-muted-foreground">Total Students</div>
          <div className="font-bold">{session.statistics.totalStudents}</div>
        </div>
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
          <div className="text-sm font-medium text-muted-foreground">Marked Present</div>
          <div className="font-bold text-green-600 dark:text-green-400">
            {Object.values(attendanceRecords).filter(r => r.status === "PRESENT").length ||
             session.statistics.presentCount}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
          <div className="text-sm font-medium text-muted-foreground">Marked Absent</div>
          <div className="font-bold text-red-600 dark:text-red-400">
            {Object.values(attendanceRecords).filter(r => r.status === "ABSENT").length ||
             session.statistics.absentCount}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
          <div className="text-sm font-medium text-muted-foreground">Other Status</div>
          <div className="font-bold text-amber-600 dark:text-amber-400">
            {Object.values(attendanceRecords).filter(r =>
              r.status !== "PRESENT" && r.status !== "ABSENT"
            ).length ||
             (session.statistics.lateCount || 0)}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-4">Student Attendance</h3>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or roll number"
              className="w-full pl-10 py-2 pr-4 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => markAllWithStatus("PRESENT")}
              className="bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200"
              disabled={!filteredStudents.length}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Present
            </Button>
            <Button
              onClick={() => markAllWithStatus("ABSENT")}
              className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200"
              disabled={!filteredStudents.length}
            >
              <X className="h-4 w-4 mr-2" />
              Mark All Absent
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter(null)}
            className={!statusFilter ? "bg-primary/10" : ""}
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("PRESENT")}
            className={statusFilter === "PRESENT" ? "bg-green-100 dark:bg-green-900" : ""}
          >
            Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("ABSENT")}
            className={statusFilter === "ABSENT" ? "bg-red-100 dark:bg-red-900" : ""}
          >
            Absent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("LATE")}
            className={statusFilter === "LATE" ? "bg-amber-100 dark:bg-amber-900" : ""}
          >
            Late
          </Button>
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No students match your search criteria" : "No students found for this class"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 bg-secondary p-3 font-medium text-sm">
                <div className="col-span-1">Present</div>
                <div className="col-span-1">#</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Roll Number</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Remarks</div>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredStudents.map((student: Student, index) => {
                  const status = getStatus(student.id);
                  const isPresent = status === "PRESENT";

                  return (
                    <div key={student.id} className="grid grid-cols-12 p-3 items-center">
                      <div className="col-span-1">
                        <Checkbox
                          checked={isPresent}
                          onCheckedChange={(checked) => togglePresent(student.id, !!checked)}
                          aria-label={`Mark ${student.name} as present`}
                        />
                      </div>
                      <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                      <div className="col-span-3 font-medium">{student.name}</div>
                      <div className="col-span-2 text-muted-foreground">{student.rollNo}</div>
                      <div className="col-span-2">
                        <Select
                          value={status}
                          onValueChange={(value) => handleStatusChange(
                            student.id,
                            value as "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED"
                          )}
                        >
                          <SelectTrigger className={
                            status === "PRESENT" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" :
                            status === "ABSENT" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" :
                            status === "LATE" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                            status === "LEAVE" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
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
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Optional remarks"
                          value={attendanceRecords[student.id]?.remark ||
                                 session.records.find((r: SessionRecord) => r.studentId === student.id)?.remark ||
                                 ""}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed button at bottom */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || markAttendanceMutation.isPending}
          size="lg"
          className="px-8 shadow-lg"
        >
          {markAttendanceMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Attendance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
