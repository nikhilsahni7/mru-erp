"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AttendanceRecord,
    useAttendanceSession,
    useMarkAttendance
} from "@/hooks/use-teacher-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, ArrowLeft, Calendar, Check, Clock, Loader2, Save, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function MarkAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch session details using the hook
  const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);

  // Debug session data
  useEffect(() => {
    if (session) {
      console.log("Session ID:", sessionId);
      console.log("Session data loaded:", session);
      console.log("Session structure:", {
        id: session.id,
        componentId: session.componentId,
        component: session.component, // Optional, if it exists
        recordsCount: session.records?.length || 0,
        course: session.course,
        date: session.date,
        stats: session.statistics
      });
      console.log("First few records:", session.records?.slice(0, 3) || []);
    }
  }, [session, sessionId]);

  // Initialize attendance records from session data
  useEffect(() => {
    try {
      if (session?.records && Array.isArray(session.records)) {
        const records = session.records
          .filter(record => record && record.studentId) // Ensure we only process valid records
          .map((record: {
            studentId: string;
            status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
            remark?: string;
          }) => ({
            studentId: record.studentId,
            status: record.status || "ABSENT", // Default to ABSENT if status is missing
            remark: record.remark
          }));

        console.log("Initialized attendance records:", records.length);
        setAttendanceRecords(records);
      } else {
        console.warn("No valid records found in session data:", session);
      }
    } catch (error) {
      console.error("Error initializing attendance records:", error);
    }
  }, [session]);

  // Mark attendance mutation
  const markAttendance = useMarkAttendance();

  // Get current status for a student
  const getStatus = (studentId: string): "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED" => {
    const record = attendanceRecords.find(record => record.studentId === studentId);
    return record?.status || "ABSENT"; // Default to ABSENT if no record exists
  };

  // Filter students by search query and status
  const filteredStudents = useMemo(() => {
    try {
      if (!session?.records || !Array.isArray(session.records)) {
        console.warn("No records found in session data");
        return [];
      }

      // First get all students from the session's records
      let students = session.records
        .filter(record => record?.student && record.student.id) // Ensure student objects are valid
        .map(record => record.student);

      // De-duplicate students by ID (in case there are duplicates)
      const uniqueStudents = Array.from(new Map(students.map(s => [s.id, s])).values());

      // Apply search filter
      let filtered = uniqueStudents;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((student) => {
          if (!student?.name || !student?.rollNo) return false;
          return student.name.toLowerCase().includes(query) ||
                 student.rollNo.toLowerCase().includes(query);
        });
      }

      // Apply status filter if selected
      if (statusFilter) {
        filtered = filtered.filter(student => {
          if (!student?.id) return false;
          const status = getStatus(student.id);
          return status === statusFilter;
        });
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering students:", error);
      return [];
    }
  }, [session, searchQuery, statusFilter, attendanceRecords, getStatus]);

  // Update attendance status for a student
  const updateAttendance = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED") => {
    const existingIndex = attendanceRecords.findIndex(record => record.studentId === studentId);

    const newRecords = [...attendanceRecords];

    if (existingIndex >= 0) {
      // Update existing record
      newRecords[existingIndex] = { ...newRecords[existingIndex], status };
    } else {
      // Add new record
      newRecords.push({ studentId, status });
    }

    setAttendanceRecords(newRecords);
    setHasChanges(true);
  };

  // Toggle present status for a student
  const togglePresent = (studentId: string, isChecked: boolean) => {
    updateAttendance(studentId, isChecked ? "PRESENT" : "ABSENT");
  };

  // Mark all visible students with a specific status
  const markAllWithStatus = (status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED") => {
    if (!filteredStudents.length) return;

    try {
      const newRecords = [...attendanceRecords];

      filteredStudents.forEach(student => {
        if (!student?.id) return; // Skip if student ID is missing

        const existingIndex = newRecords.findIndex(record => record.studentId === student.id);

        if (existingIndex >= 0) {
          // Update existing record
          newRecords[existingIndex] = { ...newRecords[existingIndex], status };
        } else {
          // Add new record
          newRecords.push({ studentId: student.id, status });
        }
      });

      setAttendanceRecords(newRecords);
      setHasChanges(true);
      toast.success(`Marked ${filteredStudents.length} students as ${status.toLowerCase()}`);
    } catch (error) {
      console.error("Error marking students:", error);
      toast.error("Failed to mark students. Please try again.");
    }
  };

  // Save attendance records
  const saveAttendance = () => {
    if (!sessionId || !attendanceRecords.length) {
      toast.error("No attendance records to save");
      return;
    }

    try {
      markAttendance.mutate({
        sessionId,
        attendanceRecords
      }, {
        onSuccess: () => {
          toast.success("Attendance marked successfully");
          setHasChanges(false);
          // Redirect to session details page
          router.push(`/dashboard/attendance/session/${sessionId}`);
        },
        onError: (error: any) => {
          console.error("Mark attendance error:", error);
          const errorMessage = error?.response?.data?.message || "Failed to mark attendance";
          toast.error(errorMessage);
        }
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    return format(new Date(isoString), "hh:mm a");
  };

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-medium">Session not found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The attendance session you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild>
          <Link href="/dashboard/attendance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground">
            Session for {session.course.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/attendance/session/${sessionId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Session
            </Link>
          </Button>
          <Button onClick={saveAttendance} disabled={!hasChanges || markAttendance.isPending}>
            {markAttendance.isPending ? (
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

      {/* Session details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{session.course.name}</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{format(new Date(session.date), "PPP")}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                <span>
                  {session.section.name}
                  {session.group ? ` (${session.group.name})` : ''}
                  - {session.componentType}
                </span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-secondary">
              <div className="text-sm font-medium text-muted-foreground">Total Students</div>
              <div className="font-bold">{session.records?.length || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-sm font-medium text-muted-foreground">Marked Present</div>
              <div className="font-bold text-green-600 dark:text-green-400">
                {attendanceRecords.filter(r => r.status === "PRESENT").length}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-sm font-medium text-muted-foreground">Marked Absent</div>
              <div className="font-bold text-red-600 dark:text-red-400">
                {attendanceRecords.filter(r => r.status === "ABSENT").length}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
              <div className="text-sm font-medium text-muted-foreground">Other Status</div>
              <div className="font-bold text-amber-600 dark:text-amber-400">
                {attendanceRecords.filter(r =>
                  r.status !== "PRESENT" && r.status !== "ABSENT"
                ).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark attendance section */}
      <Card className="mb-20">
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>
            Mark attendance for all students in this class
          </CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
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
          <div className="mt-3 flex flex-wrap gap-2">
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
        </CardHeader>
        <CardContent>
          {!session.records || session.records.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No students found for this class</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 bg-secondary p-3 font-medium text-sm">
                <div className="col-span-1">Present</div>
                <div className="col-span-1">#</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Roll Number</div>
                <div className="col-span-3">Status</div>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => {
                    if (!student?.id) return null; // Skip invalid students

                    const status = getStatus(student.id);
                    const isPresent = status === "PRESENT";

                    return (
                      <div key={student.id} className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-1">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={(checked) => togglePresent(student.id, !!checked)}
                            aria-label={`Mark ${student.name || 'student'} as present`}
                          />
                        </div>
                        <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                        <div className="col-span-4 font-medium">{student.name || 'Unnamed Student'}</div>
                        <div className="col-span-3 text-muted-foreground">{student.rollNo || 'No Roll Number'}</div>
                        <div className="col-span-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => updateAttendance(student.id, "PRESENT")}
                              className={cn(
                                "p-1.5 rounded-md flex items-center justify-center",
                                status === "PRESENT"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-muted hover:bg-green-50 dark:hover:bg-green-950"
                              )}
                              title="Present"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAttendance(student.id, "ABSENT")}
                              className={cn(
                                "p-1.5 rounded-md flex items-center justify-center",
                                status === "ABSENT"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : "bg-muted hover:bg-red-50 dark:hover:bg-red-950"
                              )}
                              title="Absent"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <select
                              value={status}
                              onChange={(e) => updateAttendance(student.id, e.target.value as any)}
                              className="text-sm border rounded-md px-1 py-1"
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                              <option value="LATE">Late</option>
                              <option value="LEAVE">Leave</option>
                              <option value="EXCUSED">Excused</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    {searchQuery ? "No students match your search criteria" : "No students found for this class"}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button at bottom */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={saveAttendance}
          disabled={!hasChanges || markAttendance.isPending}
          size="lg"
          className="px-8 shadow-lg"
        >
          {markAttendance.isPending ? (
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
