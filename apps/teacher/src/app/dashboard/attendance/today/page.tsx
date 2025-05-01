"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Calendar, ChevronRight, Clock, Loader2, Users } from "lucide-react";
import Link from "next/link";

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

export default function TodayAttendancePage() {
  // Fetch today's attendance sessions
  const { data: sessions, isLoading, error } = useQuery<AttendanceSession[]>({
    queryKey: ["todayAttendance"],
    queryFn: async () => {
      const response = await api.get("/attendance/today");
      return response.data;
    },
  });

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading attendance sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive font-medium">Failed to load attendance sessions</p>
        <p className="text-muted-foreground mt-2">Please try again later</p>
        <Button variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today's Attendance</h1>
          <p className="text-muted-foreground">
            View and manage today's attendance sessions
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
              <Calendar className="h-4 w-4 mr-2" />
              Create Session
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <Card key={session.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="sm:w-20 flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-8 w-8 mb-1" />
                  <span className="text-xs font-medium">{formatDate(session.date).split(",")[0]}</span>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{session.course.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                      </div>
                      <div>
                        Section: {session.section.name}
                      </div>
                      {session.group && (
                        <div>
                          Group: {session.group.name}
                        </div>
                      )}
                      <div>
                        {session.componentType}
                      </div>
                    </div>
                    {session.topic && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Topic:</span> {session.topic}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-secondary">
                      <div className="text-sm font-medium text-muted-foreground">Total</div>
                      <div className="font-bold">{session.statistics.totalStudents}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="text-sm font-medium text-muted-foreground">Present</div>
                      <div className="font-bold text-green-600 dark:text-green-400">{session.statistics.presentCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="text-sm font-medium text-muted-foreground">Absent</div>
                      <div className="font-bold text-red-600 dark:text-red-400">{session.statistics.absentCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div className="text-sm font-medium text-muted-foreground">Attendance</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">{session.statistics.attendancePercentage}%</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/attendance/session/${session.id}/mark`}>
                        <Users className="h-4 w-4 mr-1" />
                        Mark Attendance
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/attendance/session/${session.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="bg-card border rounded-xl p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No attendance sessions today</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any attendance sessions for today yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/attendance/create">
                <Calendar className="h-4 w-4 mr-2" />
                Create Attendance Session
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
