"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentClasses, useDayTimetable } from "@/hooks/use-teacher-data";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ClipboardList, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Type definitions can be reused from the hook

export default function SchedulePage() {
  // Get current day and set it as the default selected day
  const currentDayIndex = new Date().getDay();
  const dayMapping = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const currentDay = dayMapping[currentDayIndex];

  const [selectedDay, setSelectedDay] = useState(currentDay);

  // Fetch weekly timetable using hooks for each day
  const { data: mondayClasses, isLoading: isLoadingMonday } = useDayTimetable("MONDAY");
  const { data: tuesdayClasses, isLoading: isLoadingTuesday } = useDayTimetable("TUESDAY");
  const { data: wednesdayClasses, isLoading: isLoadingWednesday } = useDayTimetable("WEDNESDAY");
  const { data: thursdayClasses, isLoading: isLoadingThursday } = useDayTimetable("THURSDAY");
  const { data: fridayClasses, isLoading: isLoadingFriday } = useDayTimetable("FRIDAY");
  const { data: saturdayClasses, isLoading: isLoadingSaturday } = useDayTimetable("SATURDAY");
  const { data: sundayClasses, isLoading: isLoadingSunday } = useDayTimetable("SUNDAY");

  // Combine all days into a weekly timetable
  const weeklyTimetable = {
    MONDAY: mondayClasses || [],
    TUESDAY: tuesdayClasses || [],
    WEDNESDAY: wednesdayClasses || [],
    THURSDAY: thursdayClasses || [],
    FRIDAY: fridayClasses || [],
    SATURDAY: saturdayClasses || [],
    SUNDAY: sundayClasses || [],
  };

  // Fetch current and upcoming classes
  const { data: currentClassesData, isLoading: isLoadingCurrent } = useCurrentClasses();

  // Format time from 24-hour to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to check if a class is current (happening now)
  const isCurrentClass = (schedule: any) => {
    if (!currentClassesData?.currentClass) return false;
    // Compare relevant properties since IDs might be different
    return (
      currentClassesData.currentClass.courseCode === schedule.courseCode &&
      currentClassesData.currentClass.startTime === schedule.startTime &&
      currentClassesData.currentClass.section.name === schedule.section.name
    );
  };

  // Helper function to check if a class is upcoming next
  const isUpcomingClass = (schedule: any) => {
    if (!currentClassesData?.upcomingClasses || currentClassesData.upcomingClasses.length === 0) return false;

    // Check if this schedule matches the first upcoming class
    const nextClass = currentClassesData.upcomingClasses[0];
    return (
      nextClass.courseCode === schedule.courseCode &&
      nextClass.startTime === schedule.startTime &&
      nextClass.section.name === schedule.section.name
    );
  };

  const isLoading =
    isLoadingMonday || isLoadingTuesday || isLoadingWednesday ||
    isLoadingThursday || isLoadingFriday || isLoadingSaturday ||
    isLoadingSunday || isLoadingCurrent;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">View and manage your teaching schedule</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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

      {/* Current/Next Class Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle>Current/Upcoming Class</CardTitle>
          <CardDescription>
            Your immediate teaching responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Class */}
            <div className="p-4 rounded-lg border bg-secondary/50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-muted-foreground text-sm">Current Class</div>
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </div>

              {currentClassesData?.currentClass ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold line-clamp-1">
                    {currentClassesData.currentClass.courseName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(currentClassesData.currentClass.startTime)} - {formatTime(currentClassesData.currentClass.endTime)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.currentClass.section.name}
                    </span>
                    {currentClassesData.currentClass.group && (
                      <span className="px-2 py-1 rounded-full bg-secondary border">
                        Group {currentClassesData.currentClass.group.name}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.currentClass.roomNumber}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.currentClass.componentType}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/attendance/create?course=${currentClassesData.currentClass.courseCode}`}>
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />
                        Mark Attendance
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No class is currently in session
                </div>
              )}
            </div>

            {/* Next Class */}
            <div className="p-4 rounded-lg border bg-secondary/50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-muted-foreground text-sm">Next Class</div>
                <div className="p-1.5 rounded-full bg-primary/10">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>

              {currentClassesData?.upcomingClasses && currentClassesData.upcomingClasses.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold line-clamp-1">
                    {currentClassesData.upcomingClasses[0].courseName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(currentClassesData.upcomingClasses[0].startTime)} - {formatTime(currentClassesData.upcomingClasses[0].endTime)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.upcomingClasses[0].section.name}
                    </span>
                    {currentClassesData.upcomingClasses[0].group && (
                      <span className="px-2 py-1 rounded-full bg-secondary border">
                        Group {currentClassesData.upcomingClasses[0].group.name}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.upcomingClasses[0].roomNumber}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      {currentClassesData.upcomingClasses[0].componentType}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No upcoming classes for today
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          <CardDescription>
            Your complete teaching schedule for the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="grid grid-cols-7">
              <TabsTrigger value="MONDAY">Mon</TabsTrigger>
              <TabsTrigger value="TUESDAY">Tue</TabsTrigger>
              <TabsTrigger value="WEDNESDAY">Wed</TabsTrigger>
              <TabsTrigger value="THURSDAY">Thu</TabsTrigger>
              <TabsTrigger value="FRIDAY">Fri</TabsTrigger>
              <TabsTrigger value="SATURDAY">Sat</TabsTrigger>
              <TabsTrigger value="SUNDAY">Sun</TabsTrigger>
            </TabsList>

            {Object.entries(weeklyTimetable).map(([day, schedules]) => (
              <TabsContent key={day} value={day} className="space-y-4 mt-4">
                {schedules.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No classes scheduled for {day.toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sort schedules by start time */}
                    {schedules
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule, index) => (
                        <div
                          key={`${schedule.courseCode}-${schedule.startTime}-${index}`}
                          className={cn(
                            "p-4 rounded-lg border bg-card",
                            isCurrentClass(schedule) && "border-green-500 bg-green-50 dark:bg-green-950/20",
                            isUpcomingClass(schedule) && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                              <BookOpen className="h-5 w-5" />
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                <h3 className="font-semibold">{schedule.courseName}</h3>
                                <span className="text-sm text-muted-foreground">
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </span>
                              </div>

                              <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                                <span>{schedule.section.name}</span>
                                {schedule.group && (
                                  <>
                                    <span>•</span>
                                    <span>Group {schedule.group.name}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{schedule.componentType}</span>
                                <span>•</span>
                                <span>Room {schedule.roomNumber}</span>
                              </div>

                              <div className="flex mt-3 space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/dashboard/attendance/create?course=${schedule.courseCode}`}>
                                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                                    Mark Attendance
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
