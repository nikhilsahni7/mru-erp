"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";

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

interface AttendanceTableViewProps {
  attendanceData: AttendanceRecord[];
}

export function AttendanceTableView({
  attendanceData,
}: AttendanceTableViewProps) {
  const [showTeacherName, setShowTeacherName] = useState(false);
  const [showSubjectName, setShowSubjectName] = useState(false);

  // Group by time slots and dates
  const { timeSlots, dateColumns, attendanceMap } = useMemo(() => {
    // Get unique dates
    const dates = Array.from(
      new Set(
        attendanceData.map((record) => {
          const date =
            typeof record.date === "string"
              ? parseISO(record.date)
              : record.date;
          return format(date, "yyyy-MM-dd");
        })
      )
    ).sort();

    // Get unique time slots
    const timeSlotsSet = new Set<string>();
    attendanceData.forEach((record) => {
      const startTime =
        typeof record.startTime === "string"
          ? parseISO(record.startTime)
          : record.startTime;
      const endTime =
        typeof record.endTime === "string"
          ? parseISO(record.endTime)
          : record.endTime;
      const timeSlot = `${format(startTime, "HH:mm")} to ${format(
        endTime,
        "HH:mm"
      )}`;
      timeSlotsSet.add(timeSlot);
    });

    const timeSlots = Array.from(timeSlotsSet).sort();

    // Create map: timeSlot -> date -> attendance records
    const map = new Map<string, Map<string, AttendanceRecord[]>>();

    attendanceData.forEach((record) => {
      const date =
        typeof record.date === "string" ? parseISO(record.date) : record.date;
      const dateStr = format(date, "yyyy-MM-dd");
      const startTime =
        typeof record.startTime === "string"
          ? parseISO(record.startTime)
          : record.startTime;
      const endTime =
        typeof record.endTime === "string"
          ? parseISO(record.endTime)
          : record.endTime;
      const timeSlot = `${format(startTime, "HH:mm")} to ${format(
        endTime,
        "HH:mm"
      )}`;

      if (!map.has(timeSlot)) {
        map.set(timeSlot, new Map());
      }
      if (!map.get(timeSlot)!.has(dateStr)) {
        map.get(timeSlot)!.set(dateStr, []);
      }
      map.get(timeSlot)!.get(dateStr)!.push(record);
    });

    return { timeSlots, dateColumns: dates, attendanceMap: map };
  }, [attendanceData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-semibold shadow-md">
            P
          </div>
        );
      case "ABSENT":
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-semibold shadow-md">
            A
          </div>
        );
      case "LATE":
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-semibold shadow-md">
            L
          </div>
        );
      case "LEAVE":
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold shadow-md">
            LV
          </div>
        );
      case "EXCUSED":
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 text-white font-semibold shadow-md">
            E
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-400 text-gray-400 font-semibold">
            -
          </div>
        );
    }
  };

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
      {/* Header with Month Info */}
      <div className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
        <p className="text-center font-semibold text-lg">
          Attendance Records in {format(parseISO(dateColumns[0]), "MMMM yyyy")}
        </p>
        <p className="text-center text-sm mt-1 text-muted-foreground">
          PP : Theory • PR : Practical • TUT : Tutorial
        </p>
      </div>

      {/* Toggle Controls */}
      <div className="mb-6 flex flex-wrap gap-6 items-center justify-center bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-teacher"
            checked={showTeacherName}
            onCheckedChange={setShowTeacherName}
          />
          <Label htmlFor="show-teacher" className="cursor-pointer">
            Show Teacher Name
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-subject"
            checked={showSubjectName}
            onCheckedChange={setShowSubjectName}
          />
          <Label htmlFor="show-subject" className="cursor-pointer">
            Show Subject Name
          </Label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          {/* Rest of table */}
          <thead>
            <tr className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950">
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-semibold sticky left-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950">
                Lecture Timings
              </th>
              {dateColumns.map((dateStr) => {
                const date = parseISO(dateStr);
                return (
                  <th
                    key={dateStr}
                    className="border border-gray-300 dark:border-gray-600 p-3 text-center font-semibold min-w-[120px]"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{format(date, "EEE")}</span>
                      <span className="text-lg font-bold">
                        {format(date, "dd/MM")}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-center font-semibold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, idx) => {
              const rowRecords = attendanceMap.get(timeSlot);

              // Calculate total for this time slot
              let presentCount = 0;
              let totalCount = 0;
              rowRecords?.forEach((records) => {
                records.forEach((record) => {
                  totalCount++;
                  if (record.status === "PRESENT") presentCount++;
                });
              });

              return (
                <tr
                  key={timeSlot}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <td className="border border-gray-300 dark:border-gray-600 p-4 font-semibold sticky left-0 bg-inherit">
                    {timeSlot}
                  </td>
                  {dateColumns.map((dateStr) => {
                    const records = rowRecords?.get(dateStr) || [];

                    if (records.length === 0) {
                      return (
                        <td
                          key={dateStr}
                          className="border border-gray-300 dark:border-gray-600 p-4 text-center bg-gray-50/50 dark:bg-gray-800/50"
                        >
                          <div className="flex flex-col items-center justify-center min-h-[80px]">
                            <span className="text-gray-400 text-xs">
                              No class
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dateStr}
                        className="border border-gray-300 dark:border-gray-600 p-4"
                      >
                        <div className="flex flex-col items-center justify-center gap-3 min-h-[80px]">
                          {records.map((record) => (
                            <div
                              key={record.id}
                              className="flex flex-col items-center gap-2 w-full"
                            >
                              {getStatusBadge(record.status)}

                              {showSubjectName && (
                                <p className="text-xs text-center font-medium max-w-[150px] truncate text-foreground">
                                  {record.course.name}
                                </p>
                              )}

                              {showTeacherName && record.teacher && (
                                <p className="text-xs text-center text-muted-foreground max-w-[150px] truncate">
                                  {record.teacher.name}
                                </p>
                              )}

                              <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                              >
                                {record.componentType === "LECTURE"
                                  ? "PP"
                                  : record.componentType === "LABORATORY"
                                  ? "PR"
                                  : record.componentType === "TUTORIAL"
                                  ? "TUT"
                                  : record.componentType === "PRACTICAL"
                                  ? "PR"
                                  : record.componentType}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 dark:border-gray-600 p-4 text-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {presentCount}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        /
                      </div>
                      <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {totalCount}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-semibold mb-3 text-center">Legend</h3>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold shadow-md">
              P
            </div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold shadow-md">
              A
            </div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold shadow-md">
              L
            </div>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-md text-xs">
              LV
            </div>
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
              E
            </div>
            <span>Excused</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
