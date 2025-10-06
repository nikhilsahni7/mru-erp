"use client";

import { DateRange } from "@/components/attendance/attendance-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, isSaturday, isSunday, parseISO } from "date-fns";
import { useState } from "react";

interface AttendanceRecord {
  id: string;
  date: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  componentType: string;
  topic?: string | null;
  course: {
    id: string;
    code: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  } | null;
  status: string;
  markedAt?: string | Date | null;
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceRecord[];
  dateRange?: DateRange;
  customStartDate?: Date;
  customEndDate?: Date;
  showCompactView?: boolean;
}

export function AttendanceCalendar({
  attendanceData,
  dateRange,
  customStartDate,
  customEndDate,
  showCompactView = false,
}: AttendanceCalendarProps) {
  const [showTeacherName, setShowTeacherName] = useState(true);
  const [showSubjectName, setShowSubjectName] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ABSENT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-600 hover:bg-green-700">P</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-600 hover:bg-red-700">A</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // Group attendance by date
  const groupedByDate = attendanceData.reduce((acc, record) => {
    const dateStr = format(
      typeof record.date === "string" ? parseISO(record.date) : record.date,
      "yyyy-MM-dd"
    );
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  if (attendanceData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No attendance records found for the selected period
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Attendance Records</h2>
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-teacher"
              checked={showTeacherName}
              onCheckedChange={setShowTeacherName}
            />
            <Label htmlFor="show-teacher">Show Teacher Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-subject"
              checked={showSubjectName}
              onCheckedChange={setShowSubjectName}
            />
            <Label htmlFor="show-subject">Show Subject Name</Label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map((dateStr) => {
          const date = parseISO(dateStr);
          const isWeekend = isSaturday(date) || isSunday(date);
          const sessions = groupedByDate[dateStr].sort((a, b) => {
            const timeA =
              typeof a.startTime === "string"
                ? parseISO(a.startTime)
                : a.startTime;
            const timeB =
              typeof b.startTime === "string"
                ? parseISO(b.startTime)
                : b.startTime;
            return timeA.getTime() - timeB.getTime();
          });

          return (
            <div key={dateStr} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </h3>
                  {isWeekend && (
                    <Badge variant="outline" className="mt-1">
                      Weekend
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {sessions.length}{" "}
                  {sessions.length === 1 ? "session" : "sessions"}
                </div>
              </div>

              <div className="grid gap-3">
                {sessions.map((session) => {
                  const startTime =
                    typeof session.startTime === "string"
                      ? parseISO(session.startTime)
                      : session.startTime;
                  const endTime =
                    typeof session.endTime === "string"
                      ? parseISO(session.endTime)
                      : session.endTime;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border",
                        getStatusColor(session.status)
                      )}
                    >
                      <div className="flex items-center justify-center min-w-[40px]">
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {format(startTime, "HH:mm")} -{" "}
                            {format(endTime, "HH:mm")}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {session.componentType}
                          </Badge>
                        </div>

                        {showSubjectName && (
                          <p className="font-semibold">
                            {session.course.code} - {session.course.name}
                          </p>
                        )}

                        {showTeacherName && session.teacher && (
                          <p className="text-sm text-muted-foreground">
                            {session.teacher.name}
                          </p>
                        )}

                        {session.topic && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            Topic: {session.topic}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
