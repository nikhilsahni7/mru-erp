"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { endOfMonth, format, isToday, parseISO, startOfMonth } from "date-fns";
import {
    ArrowUpDown,
    BarChart, Calendar, ChevronRight, ClipboardList,
    FileDown,
    FileText,
    Loader2, Plus, Search, Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
  componentId: string;
  componentType: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
  };
}

export default function AttendancePage() {
  // Current date range defaults to current month
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "course">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [componentFilter, setComponentFilter] = useState<string>("");

  // Fetch attendance sessions in date range
  const { data: sessions, isLoading } = useQuery<AttendanceSession[]>({
    queryKey: ["attendanceSessions", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const response = await api.get(
        `/attendance/sessions?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`
      );
      return response.data;
    },
  });

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

  // Filter and sort sessions
  const filteredSessions = sessions
    ? sessions
        .filter(session => {
          // Apply search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              session.course.name.toLowerCase().includes(query) ||
              session.course.code.toLowerCase().includes(query) ||
              session.section.name.toLowerCase().includes(query) ||
              (session.group && session.group.name.toLowerCase().includes(query))
            );
          }
          return true;
        })
        .filter(session => {
          // Apply component type filter
          if (componentFilter) {
            return session.componentType === componentFilter;
          }
          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortBy === "date") {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          } else {
            // Sort by course name
            const nameA = a.course.name.toLowerCase();
            const nameB = b.course.name.toLowerCase();
            return sortDirection === "asc"
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA);
          }
        })
    : [];

  // Format date display
  const formatDateDisplay = (dateString: string) => {
    const date = parseISO(dateString);
    return isToday(date)
      ? "Today"
      : format(date, "MMM d, yyyy");
  };

  // Format time display
  const formatTimeDisplay = (timeString: string) => {
    return format(new Date(timeString), "h:mm a");
  };

  // Component types from the data for filtering
  const componentTypes = sessions
    ? [...new Set(sessions.map(s => s.componentType))]
    : [];

  // Toggle sort direction
  const toggleSort = (field: "date" | "course") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            Create and manage attendance sessions for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/attendance/reports">
              <BarChart className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/attendance/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick actions cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <CardDescription>Sessions for today</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="text-2xl font-bold">
              {sessions?.filter(s => isToday(parseISO(s.date))).length || 0}
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
            <Button size="sm" variant="outline" onClick={() => exportAttendance.mutate()}>
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
              {sessions && sessions.length > 0
                ? Math.round(
                    sessions.reduce(
                      (sum, session) => sum + session.statistics.attendancePercentage,
                      0
                    ) / sessions.length
                  )
                : 0}%
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

      {/* Sessions list */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Sessions</CardTitle>
          <CardDescription>
            All attendance sessions for {format(startDate, "MMMM yyyy")}
          </CardDescription>

          {/* Filters and search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by course, section, or group"
                className="w-full pl-10 py-2 pr-4 border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2"
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
              >
                <option value="">All Component Types</option>
                {componentTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className={`px-3 flex items-center ${
                    sortBy === "date" ? "bg-secondary" : ""
                  }`}
                  onClick={() => toggleSort("date")}
                >
                  Date
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`px-3 flex items-center ${
                    sortBy === "course" ? "bg-secondary" : ""
                  }`}
                  onClick={() => toggleSort("course")}
                >
                  Course
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No attendance sessions found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || componentFilter
                  ? "Try adjusting your search filters"
                  : "Create your first attendance session"}
              </p>
              <Button asChild>
                <Link href="/dashboard/attendance/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Attendance Session
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/attendance/session/${session.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                      <div className="font-medium text-lg">{session.course.name}</div>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDateDisplay(session.date)}</span>
                        <span className="mx-1">•</span>
                        <span>
                          {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                      <div>Course Code: {session.course.code}</div>
                      <div>Section: {session.section.name}</div>
                      {session.group && <div>Group: {session.group.name}</div>}
                      <div>Type: {session.componentType}</div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="bg-secondary px-3 py-1 rounded-full text-xs flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{session.statistics.totalStudents} students</span>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs">
                        Present: {session.statistics.presentCount} ({session.statistics.attendancePercentage}%)
                      </div>
                      <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs">
                        Absent: {session.statistics.absentCount}
                      </div>
                      {session.topic && (
                        <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs">
                          Topic: {session.topic}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
