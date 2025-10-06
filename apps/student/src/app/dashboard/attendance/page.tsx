"use client";

import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import {
  AttendanceFilters,
  DateRange,
} from "@/components/attendance/attendance-filters";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { AttendanceTableView } from "@/components/attendance/attendance-table-view";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { attendanceApi } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type ViewMode = "daywise" | "overall" | "subjectwise";

export default function AttendancePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("overall");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    undefined
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    undefined
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch attendance summary for overall stats
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: attendanceApi.getAttendanceSummary,
  });

  // Fetch attendance data based on selected date range
  const getAttendanceQuery = () => {
    if (dateRange === "today") {
      return {
        queryKey: ["attendance", "today"] as const,
        queryFn: attendanceApi.getTodayAttendance,
      };
    } else if (dateRange === "custom") {
      // Custom date range
      if (!customStartDate || !customEndDate) {
        return null;
      }

      return {
        queryKey: [
          "attendance",
          "range",
          customStartDate.toISOString(),
          customEndDate.toISOString(),
        ] as const,
        queryFn: () =>
          attendanceApi.getAttendanceByDateRange(
            customStartDate.toISOString(),
            customEndDate.toISOString()
          ),
      };
    }
  };

  const attendanceQuery = getAttendanceQuery();
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: attendanceQuery?.queryKey || ["attendance", "disabled"],
    queryFn: attendanceQuery?.queryFn || (() => Promise.resolve([])),
    enabled: !!attendanceQuery,
  });

  // Fetch course-specific attendance if a course is selected
  const { data: courseAttendanceData, isLoading: courseLoading } = useQuery({
    queryKey: ["attendance", "course", selectedCourseId],
    queryFn: () => attendanceApi.getCourseAttendance(selectedCourseId!),
    enabled: !!selectedCourseId,
  });

  const isLoading =
    summaryLoading ||
    attendanceLoading ||
    (selectedCourseId ? courseLoading : false);

  // Determine which data to display
  const displayData =
    selectedCourseId && courseAttendanceData
      ? (courseAttendanceData.sessions || []).map((session: any) => ({
          ...session,
          course: {
            id: courseAttendanceData.course.id,
            code: courseAttendanceData.course.code,
            name: courseAttendanceData.course.name,
          },
        }))
      : attendanceData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            View and track your class attendance
          </p>
        </div>
      </div>

      {/* Overall Statistics - Always visible */}
      {summaryLoading ? (
        <Card className="p-6">
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : (
        <AttendanceStats
          stats={summaryData?.overall || null}
          courseWiseStats={null}
          showTitle={true}
          title="Overall Attendance Summary"
        />
      )}

      {/* Tabs for different views */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as ViewMode)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Overall Attendance</TabsTrigger>
          <TabsTrigger value="subjectwise">Subject Wise</TabsTrigger>
          <TabsTrigger value="daywise">Day Wise Attendance</TabsTrigger>
        </TabsList>

        {/* Overall Attendance Tab */}
        <TabsContent value="overall" className="space-y-4">
          {summaryLoading ? (
            <Card className="p-6">
              <Skeleton className="h-96 w-full" />
            </Card>
          ) : (
            <AttendanceStats
              stats={null}
              courseWiseStats={summaryData?.courseWise || []}
              showTitle={false}
            />
          )}
        </TabsContent>

        {/* Subject Wise Tab */}
        <TabsContent value="subjectwise" className="space-y-4">
          <AttendanceFilters
            dateRange={dateRange}
            setDateRange={setDateRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            courses={summaryData?.courseWise || []}
            showCourseFilter={true}
            showDateRange={false}
          />

          {isLoading ? (
            <Card className="p-6">
              <Skeleton className="h-96 w-full" />
            </Card>
          ) : selectedCourseId && courseAttendanceData ? (
            <div className="space-y-4">
              {/* Course Stats */}
              <AttendanceStats
                stats={courseAttendanceData.statistics}
                courseWiseStats={null}
                showTitle={true}
                title={`${courseAttendanceData.course.code} - ${courseAttendanceData.course.name}`}
              />

              {/* Course Sessions - Add course info to each session */}
              <AttendanceCalendar
                attendanceData={(courseAttendanceData.sessions || []).map(
                  (session: any) => ({
                    ...session,
                    course: {
                      id: courseAttendanceData.course.id,
                      code: courseAttendanceData.course.code,
                      name: courseAttendanceData.course.name,
                    },
                  })
                )}
                dateRange="today"
                showCompactView={true}
              />
            </div>
          ) : (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
                Please select a course to view attendance details
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Day Wise Attendance Tab */}
        <TabsContent value="daywise" className="space-y-4">
          <AttendanceFilters
            dateRange={dateRange}
            setDateRange={setDateRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            courses={summaryData?.courseWise || []}
            showCourseFilter={true}
            showDateRange={true}
          />

          {isLoading ? (
            <Card className="p-6">
              <Skeleton className="h-96 w-full" />
            </Card>
          ) : dateRange === "custom" ? (
            // Show table view for custom range
            <AttendanceTableView attendanceData={displayData || []} />
          ) : (
            // Show card-based view for today
            <AttendanceCalendar
              attendanceData={displayData || []}
              dateRange={dateRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              showCompactView={false}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
