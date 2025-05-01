"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, ArrowLeft, BarChart, Calendar, Check, Clock, Download, Edit, Loader2, Pencil, Search, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface Student {
  id: string;
  name: string;
  rollNo: string;
  group: {
    id: string;
    name: string;
  };
}

interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
  course: {
    id: string;
    code: string;
    name: string;
  };
  componentType: string;
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  teacher: {
    id: string;
    name: string;
  };
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    excusedCount: number;
    attendancePercentage: number;
  };
  records: {
    id: string;
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
    remark?: string;
    student: Student;
  }[];
}

export default function AttendanceSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch session details
  const { data: session, isLoading } = useQuery<AttendanceSession>({
    queryKey: ["attendanceSession", sessionId],
    queryFn: async () => {
      const response = await api.get(`/attendance/session/${sessionId}`);
      return response.data;
    },
  });

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    return format(new Date(isoString), "hh:mm a");
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT":
        return { label: "Present", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950" };
      case "ABSENT":
        return { label: "Absent", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" };
      case "LATE":
        return { label: "Late", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" };
      case "LEAVE":
        return { label: "Leave", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" };
      case "EXCUSED":
        return { label: "Excused", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950" };
      default:
        return { label: status, color: "text-muted-foreground bg-muted" };
    }
  };

  // Filter students
  const filteredRecords = session?.records.filter(record => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      record.student.name.toLowerCase().includes(query) ||
      record.student.rollNo.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading session details...</p>
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
          <h1 className="text-2xl font-bold">Attendance Session</h1>
          <p className="text-muted-foreground">
            View and manage attendance for this session
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/attendance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/attendance/session/${sessionId}/mark`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* Session details card */}
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
            {session.topic && (
              <div className="mt-2">
                <span className="font-medium">Topic:</span> {session.topic}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-secondary">
              <div className="text-sm font-medium text-muted-foreground">Total Students</div>
              <div className="font-bold">{session.statistics.totalStudents}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-sm font-medium text-muted-foreground">Present</div>
              <div className="font-bold text-green-600 dark:text-green-400">
                {session.statistics.presentCount}
                ({session.statistics.attendancePercentage}%)
              </div>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-sm font-medium text-muted-foreground">Absent</div>
              <div className="font-bold text-red-600 dark:text-red-400">
                {session.statistics.absentCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
              <div className="text-sm font-medium text-muted-foreground">Other</div>
              <div className="font-bold text-amber-600 dark:text-amber-400">
                {session.statistics.lateCount +
                  session.statistics.leaveCount +
                  session.statistics.excusedCount}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-between">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/attendance/reports/component/${session.course.id}`}>
                <BarChart className="h-4 w-4 mr-2" />
                View Course Reports
              </Link>
            </Button>
            <div className="flex gap-2">
              {process.env.NODE_ENV === "development" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Session Data:", session);
                    console.log("Filtered Records:", filteredRecords);
                    alert("Check console for debug data");
                  }}
                >
                  Debug Data
                </Button>
              )}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Attendance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student attendance list */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>
            View attendance records for all students in this session
          </CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or roll number"
              className="w-full pl-10 py-2 pr-4 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 bg-secondary p-3 font-medium text-sm">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Roll Number</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Action</div>
            </div>

            <div className="divide-y">
              {filteredRecords && filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => {
                  const statusInfo = getStatusLabel(record.status);
                  return (
                    <div key={record.id} className="grid grid-cols-12 p-3 items-center">
                      <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                      <div className="col-span-5 font-medium">{record.student.name}</div>
                      <div className="col-span-3 text-muted-foreground">{record.student.rollNo}</div>
                      <div className="col-span-2">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-xs font-medium",
                          statusInfo.color
                        )}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/attendance/record/${record.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  {searchQuery ? "No students match your search criteria" : "No attendance records found"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Present students summary */}
      <Card>
        <CardHeader>
          <CardTitle>Present Students</CardTitle>
          <CardDescription>Quick summary of students who attended</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {session.records
              .filter(r => r.status === "PRESENT")
              .map(record => (
                <div
                  key={record.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950"
                >
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm">{record.student.name}</span>
                </div>
              ))}

            {session.records.filter(r => r.status === "PRESENT").length === 0 && (
              <p className="text-muted-foreground py-2">No students marked as present</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Absent students summary */}
      <Card>
        <CardHeader>
          <CardTitle>Absent Students</CardTitle>
          <CardDescription>Students who didn't attend this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {session.records
              .filter(r => r.status === "ABSENT")
              .map(record => (
                <div
                  key={record.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950"
                >
                  <span className="text-sm text-red-600 dark:text-red-400">{record.student.name}</span>
                </div>
              ))}

            {session.records.filter(r => r.status === "ABSENT").length === 0 && (
              <p className="text-muted-foreground py-2">No students marked as absent</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
