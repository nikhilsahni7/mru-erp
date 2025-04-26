"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, Calendar, Clock, FileText, GraduationCap, LineChart, Loader2, User } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoadingUser, isError } = useAuth();

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

  if (isError) {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <section className="rounded-lg bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground shadow-md">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Student"}!</h1>
            <p className="text-primary-foreground/90">
              Here's what's happening with your academic journey today.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/10 p-2 backdrop-blur-sm">
            <Clock className="h-5 w-5" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8/4.0</div>
            <p className="text-xs text-muted-foreground">
              Top 15% of your class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              18 credit hours this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Due this week
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Schedule and Courses section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  subject: "Computer Science 101",
                  time: "09:00 AM - 10:30 AM",
                  location: "Room 302, CS Building",
                  professor: "Dr. Johnson",
                },
                {
                  id: 2,
                  subject: "Data Structures and Algorithms",
                  time: "11:00 AM - 12:30 PM",
                  location: "Room 405, Engineering Building",
                  professor: "Prof. Smith",
                },
                {
                  id: 3,
                  subject: "Database Management Systems",
                  time: "02:00 PM - 03:30 PM",
                  location: "Lab 201, CS Building",
                  professor: "Dr. Williams",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-lg border p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.subject}</h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      <span>{item.professor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Academic Progress</CardTitle>
            <CardDescription>Your performance over time</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex aspect-square items-center justify-center rounded-lg bg-muted p-8">
              <LineChart className="h-12 w-12 text-muted-foreground" />
              <span className="mt-2 text-center text-sm text-muted-foreground">Academic progress chart will be shown here</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <div className="text-xl font-bold">87%</div>
                <div className="text-xs text-muted-foreground">Assignments</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <div className="text-xl font-bold">92%</div>
                <div className="text-xs text-muted-foreground">Exams</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Important dates and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  id: 1,
                  title: "Mid-Term Exams",
                  date: "October 15-20, 2024",
                  description:
                    "Prepare for your mid-term exams. Check the schedule for specific times.",
                },
                {
                  id: 2,
                  title: "Project Submission",
                  date: "November 5, 2024",
                  description:
                    "Final deadline for the semester project submission.",
                },
                {
                  id: 3,
                  title: "Career Fair",
                  date: "November 12, 2024",
                  description:
                    "Annual career fair with representatives from top companies.",
                },
              ].map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col rounded-lg border p-4 shadow-sm"
                >
                  <h3 className="font-semibold">{event.title}</h3>
                  <div className="mt-1 text-sm font-medium text-primary">
                    {event.date}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
