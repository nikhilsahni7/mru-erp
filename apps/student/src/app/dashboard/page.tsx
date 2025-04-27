"use client";

import { CoursesList } from "@/components/student/courses-list";
import { CurrentClass } from "@/components/student/current-class";
import { StudentProfileCard } from "@/components/student/student-profile-card";
import { TodayClasses } from "@/components/student/today-classes";
import { WeeklyTimetable } from "@/components/student/weekly-timetable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, isLoadingUser, isError, error } = useAuth();
  const router = useRouter();

  // Handle auth errors with proper feedback, but only if we attempted to load
  useEffect(() => {
    if (isError && error && !isLoadingUser) {
      const errorMessage = error?.response?.data?.message || "Authentication failed. Please login again.";
      toast.error(errorMessage);

      // Redirect to login after a short delay to allow toast to be visible
      const timeout = setTimeout(() => {
        router.push("/login");
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [isError, error, router, isLoadingUser]);

  if (isLoadingUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Only show the error UI if we've actually attempted to load and failed
  if (isError && !isLoadingUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertTriangle className="h-10 w-10" />
            <h2 className="text-xl font-bold">Authentication Error</h2>
            <p className="text-center text-muted-foreground max-w-sm">
              There was a problem with your session. You'll be redirected to the login page.
            </p>
          </div>
          <Button onClick={() => router.push("/login")} className="mt-2">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Safeguard - if somehow we don't have user data but also no error, redirect to login
  if (!user && !isLoadingUser) {
    router.push("/login");
    return null;
  }

  // Format date for display
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your academic portal
          </p>
        </div>
        <div className="bg-muted/40 text-muted-foreground py-1 px-3 rounded-md border text-sm font-medium">
          {formattedDate}
        </div>
      </section>

      {/* Main dashboard content */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="w-full justify-start bg-background border-b rounded-none h-12 px-4">
          <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">Overview</TabsTrigger>
          <TabsTrigger value="timetable" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">Timetable</TabsTrigger>
          <TabsTrigger value="courses" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">My Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0 space-y-8">
          {/* Profile and Quick Info */}
          <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-12">
            {/* Profile Card - Larger on bigger screens */}
            <div className="md:col-span-3 lg:col-span-4">
              <StudentProfileCard />
            </div>

            {/* Summary Widgets */}
            <div className="md:col-span-4 lg:col-span-8 space-y-6">
              {/* Current class info */}
              <CurrentClass />

              {/* Today's classes */}
              <TodayClasses />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timetable" className="m-0">
          <WeeklyTimetable />
        </TabsContent>

        <TabsContent value="courses" className="m-0">
          <CoursesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
