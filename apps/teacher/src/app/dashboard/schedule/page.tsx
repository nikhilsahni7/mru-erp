"use client";

import { CurrentClassCard } from "@/components/dashboard/schedule/current-class-card";
import { ClassDetails, WeeklySchedule } from "@/components/dashboard/schedule/types";
import { WeeklyTimetable } from "@/components/dashboard/schedule/weekly-timetable";
import { Button } from "@/components/ui/button";
import { useCurrentClasses, useDayTimetable } from "@/hooks/use-teacher-data";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SchedulePage() {
  // Get current day and set it as the default selected day
  const currentDayIndex = new Date().getDay();
  const dayMapping = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const currentDay = dayMapping[currentDayIndex];

  // Fetch weekly timetable using hooks for each day
  const { data: mondayClasses, isLoading: isLoadingMonday } = useDayTimetable("MONDAY");
  const { data: tuesdayClasses, isLoading: isLoadingTuesday } = useDayTimetable("TUESDAY");
  const { data: wednesdayClasses, isLoading: isLoadingWednesday } = useDayTimetable("WEDNESDAY");
  const { data: thursdayClasses, isLoading: isLoadingThursday } = useDayTimetable("THURSDAY");
  const { data: fridayClasses, isLoading: isLoadingFriday } = useDayTimetable("FRIDAY");
  const { data: saturdayClasses, isLoading: isLoadingSaturday } = useDayTimetable("SATURDAY");
  const { data: sundayClasses, isLoading: isLoadingSunday } = useDayTimetable("SUNDAY");

  // Combine all days into a weekly timetable
  const weeklyTimetable: WeeklySchedule = {
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

  // Helper function to check if a class is current (happening now)
  const isCurrentClass = (schedule: ClassDetails) => {
    if (!currentClassesData?.currentClass) return false;
    // Compare relevant properties since IDs might be different
    return (
      currentClassesData.currentClass.courseCode === schedule.courseCode &&
      currentClassesData.currentClass.startTime === schedule.startTime &&
      currentClassesData.currentClass.section.name === schedule.section.name
    );
  };

  // Helper function to check if a class is upcoming next
  const isUpcomingClass = (schedule: ClassDetails) => {
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
      <CurrentClassCard
        currentClass={currentClassesData?.currentClass || null}
        upcomingClasses={currentClassesData?.upcomingClasses || []}
      />

      {/* Weekly Schedule */}
      <WeeklyTimetable
        weeklyTimetable={weeklyTimetable}
        isCurrentClass={isCurrentClass}
        isUpcomingClass={isUpcomingClass}
        currentDay={currentDay}
      />
    </div>
  );
}
