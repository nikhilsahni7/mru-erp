"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentClasses, useTodayClasses } from "@/hooks/use-teacher-data";
import { AuthService } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  BookOpen,
  Calendar, ChevronRight, ClipboardList,
  Clock,
  GraduationCap,
  Loader2,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Types for our API responses
interface TeacherStats {
  todayClassesCount: number;
  totalStudentsCount: number;
  coursesCount: number;
  averageAttendance: number;
}

interface ClassSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
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
  classroom: {
    id: string;
    name: string;
    building: string;
    floor: number;
  };
}

interface CurrentClassResponse {
  current: ClassSchedule | null;
  upcoming: ClassSchedule[] | null;
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch teacher's profile/details
  const { data: teacherDetails, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacherDetails"],
    queryFn: async () => {
      return await AuthService.getProfile();
    },
  });

  // Fetch today's classes using hook
  const { data: todayClasses, isLoading: isLoadingToday } = useTodayClasses();

  // Fetch current and upcoming classes using hook
  const { data: currentClassesData, isLoading: isLoadingCurrent } = useCurrentClasses();

  // Fetch courses to count them
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return await response.json();
    },
  });

  // Calculate stats
  const teacherStats = {
    todayClassesCount: todayClasses?.length || 0,
    totalStudentsCount: 156, // Placeholder - would come from a dedicated API
    coursesCount: courses?.length || 0,
    averageAttendance: 83, // Placeholder - would come from a dedicated API
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time from 24-hour string to 12-hour format
  const formatTimeFromString = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Loading state
  const isLoading = isLoadingTeacher || isLoadingToday || isLoadingCurrent || isLoadingCourses;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome Back, {teacherDetails?.name || "Professor"}</h1>
          <p className="text-muted-foreground">
            {formatDate(currentTime)} | {formatTime(currentTime)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/schedule">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/attendance">
              <ClipboardList className="h-4 w-4 mr-2" />
              Mark Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <CardDescription>Scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{teacherStats.todayClassesCount}</div>
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <CardDescription>Across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{teacherStats.totalStudentsCount}</div>
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <CardDescription>Currently teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{teacherStats.coursesCount}</div>
              <div className="p-2 rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CardDescription>This month's average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{teacherStats.averageAttendance}%</div>
              <div className="p-2 rounded-full bg-primary/10">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Upcoming Classes */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>
                Your schedule for today
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/schedule">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentClassesData?.currentClass && (
                <div className="flex items-start border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="mr-4 mt-1 p-2 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{currentClassesData.currentClass.courseName} <span className="text-sm text-green-600 dark:text-green-400">(Current)</span></p>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeFromString(currentClassesData.currentClass.startTime)} - {formatTimeFromString(currentClassesData.currentClass.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Section: {currentClassesData.currentClass.section.name}</span>
                      {currentClassesData.currentClass.group && (
                        <>
                          <span>•</span>
                          <span>Group: {currentClassesData.currentClass.group.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Room: {currentClassesData.currentClass.roomNumber}</span>
                    </div>
                    <div className="flex mt-3 space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/attendance/create?course=${currentClassesData.currentClass.courseCode}`}>
                          <ClipboardList className="h-3.5 w-3.5 mr-1" />
                          Mark Attendance
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/schedule`}>
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentClassesData?.upcomingClasses && currentClassesData.upcomingClasses.map((cls) => (
                <div key={`${cls.courseCode}-${cls.startTime}`} className="flex items-start border rounded-lg p-3">
                  <div className="mr-4 mt-1 p-2 rounded-md bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{cls.courseName}</p>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeFromString(cls.startTime)} - {formatTimeFromString(cls.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Section: {cls.section.name}</span>
                      {cls.group && (
                        <>
                          <span>•</span>
                          <span>Group: {cls.group.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Room: {cls.roomNumber}</span>
                    </div>
                    <div className="flex mt-3 space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/attendance/create?course=${cls.courseCode}`}>
                          <ClipboardList className="h-3.5 w-3.5 mr-1" />
                          Mark Attendance
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/schedule`}>
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {(!currentClassesData?.currentClass && (!currentClassesData?.upcomingClasses || currentClassesData.upcomingClasses.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No more classes scheduled for today</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/schedule">View Full Schedule</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional widgets would go here */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for faculty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/attendance" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Mark Attendance</h4>
                <p className="text-sm text-muted-foreground">Record student attendance for your classes</p>
              </div>
            </Link>

            <Link href="/dashboard/schedule" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">View Timetable</h4>
                <p className="text-sm text-muted-foreground">Check your weekly teaching schedule</p>
              </div>
            </Link>

            <Link href="/dashboard/profile" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Academic Profile</h4>
                <p className="text-sm text-muted-foreground">Manage your faculty profile and details</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
