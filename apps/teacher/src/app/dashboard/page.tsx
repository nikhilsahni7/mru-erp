"use client";

import { ClassScheduleCard } from "@/components/dashboard/class-schedule-card";
import { DashboardLoading } from "@/components/dashboard/loading-state";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentClasses, useTodayClasses } from "@/hooks/use-teacher-data";
import { ApiService } from "@/lib/axios";
import { formatDate, formatTime, formatTimeFromString } from "@/lib/date-utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep current time updated
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Use cached auth profile instead of re-fetching
  const { user, isLoadingUser } = useAuth();

  // Fetch today's classes using hook
  const { data: todayClasses, isLoading: isLoadingToday } = useTodayClasses();

  // Fetch current and upcoming classes using hook
  const { data: currentClassesData, isLoading: isLoadingCurrent } =
    useCurrentClasses();

  // Fetch courses count via backend ApiService (non-blocking, no retries)
  const { data: courses } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      const response = await ApiService.getTeacherCourses();
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate stats
  const teacherStats = {
    todayClassesCount: todayClasses?.length || 0,
    totalStudentsCount: 156, // Placeholder - would come from a dedicated API
    coursesCount: courses?.length || 0,
    averageAttendance: 83, // Placeholder - would come from a dedicated API
  };

  // Loading state (do not block on courses)
  const isLoading = isLoadingUser || isLoadingToday || isLoadingCurrent;

  if (isLoading) {
    return <DashboardLoading />;
  }

  // Map the data to the format expected by the ClassScheduleCard component
  const mappedCurrentClass = currentClassesData?.currentClass || null;
  const mappedUpcomingClasses = currentClassesData?.upcomingClasses || null;

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <WelcomeHeader
        userName={user?.name || "Professor"}
        currentDate={formatDate(currentTime)}
        currentTime={formatTime(currentTime)}
      />

      {/* Stats cards */}
      <StatsCards stats={teacherStats} />

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Upcoming Classes */}
        <ClassScheduleCard
          currentClass={mappedCurrentClass}
          upcomingClasses={mappedUpcomingClasses}
          formatTimeFromString={formatTimeFromString}
        />

        {/* Quick Actions */}
        <QuickActionsCard />
      </div>
    </div>
  );
}
