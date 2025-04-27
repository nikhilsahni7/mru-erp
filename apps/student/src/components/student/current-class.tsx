import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrentClasses } from "@/hooks/use-student-data";
import { ClassScheduleEntry } from "@/lib/student-api";
import { AlertTriangle, BookOpen, Timer } from "lucide-react";
import { useEffect, useState } from "react";

export function CurrentClass() {
  const { data, isLoading, error } = useCurrentClasses();
  const [progressPercent, setProgressPercent] = useState(0);

  // Update progress bar timer
  useEffect(() => {
    if (!data?.currentClass) return;

    const startTime = new Date(data.currentClass.startTime);
    const endTime = new Date(data.currentClass.endTime);

    // Extract hours and minutes
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // Calculate total duration in minutes
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    const updateProgress = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Calculate elapsed minutes
      const elapsedMinutes = (currentHour * 60 + currentMinute) - (startHour * 60 + startMinute);

      // Calculate progress percentage
      const percent = Math.min(Math.max((elapsedMinutes / totalMinutes) * 100, 0), 100);

      setProgressPercent(percent);
    };

    // Update immediately and then every second
    updateProgress();
    const intervalId = setInterval(updateProgress, 1000);

    return () => clearInterval(intervalId);
  }, [data?.currentClass]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted"></div>
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-md bg-muted"></div>
            <div className="h-4 w-full animate-pulse rounded-md bg-muted"></div>
            <div className="h-24 animate-pulse rounded-md bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Failed to load current class information. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-md">
      <CardHeader className="border-b bg-card pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-950">
              <Timer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle>Current Session</CardTitle>
          </div>
          {data?.currentClass && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
              Live
            </Badge>
          )}
        </div>
        <CardDescription>
          Your current and upcoming classes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Current class */}
        {data?.currentClass ? (
          <div className="animate-fadeIn">
            <div className="relative border-b p-6">
              {/* Progress line along the top */}
              <div className="absolute inset-x-0 top-0 h-1 w-full bg-muted">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear dark:bg-emerald-600"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge className="mb-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <div className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                    In Progress
                  </Badge>
                  <h3 className="text-xl font-semibold">{data.currentClass.courseName}</h3>
                  <p className="text-sm text-muted-foreground">{data.currentClass.courseCode}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-medium uppercase border-muted"
                >
                  {data.currentClass.componentType.toLowerCase()}
                </Badge>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-md border bg-muted/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Location</p>
                  <p className="text-base font-medium">{data.currentClass.roomNumber || 'No room assigned'}</p>
                </div>
                <div className="rounded-md border bg-muted/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Instructor</p>
                  <p className="text-base font-medium">{data.currentClass.teacher.name}</p>
                </div>
                <div className="rounded-md border bg-muted/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Time</p>
                  <p className="text-base font-medium">{formatTime(data.currentClass.startTime)} - {formatTime(data.currentClass.endTime)}</p>
                </div>
                <div className="rounded-md border bg-muted/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Progress</p>
                  <p className="text-base font-medium">{Math.round(progressPercent)}%</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Class Progress</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{Math.round(progressPercent)}% Complete</span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2.5 rounded-full bg-muted"

                />

                <p className="mt-2 text-xs text-center text-muted-foreground">
                  {getTimeRemaining(data.currentClass.endTime)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 rounded-full bg-muted/30 p-3">
              <BookOpen className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium">No Class In Progress</p>
            {data?.upcomingClasses && data.upcomingClasses.length > 0 ? (
              <div className="mt-1">
                <p className="text-sm text-muted-foreground">
                  Next class starts in <span className="font-medium text-primary">
                    <NextClassCountdown classItem={data.upcomingClasses[0]} />
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.upcomingClasses[0].courseName} at {formatTime(data.upcomingClasses[0].startTime)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You're not in any class right now
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format time
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Helper function to get remaining time in a readable format
function getTimeRemaining(endTimeStr: string) {
  const now = new Date();
  const endTime = new Date(endTimeStr);

  // Extract hours and minutes for time comparison
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();

  // Calculate difference in minutes
  let diffMins = (endHour * 60 + endMinute) - (currentHour * 60 + currentMinute);

  // If negative or zero, class is ending
  if (diffMins <= 0) return "Class ending soon";

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''} remaining`;
  }
  return `${mins} minute${mins !== 1 ? 's' : ''} remaining`;
}

// Component to display countdown to next class
function NextClassCountdown({ classItem }: { classItem: ClassScheduleEntry }) {
  const [timeUntil, setTimeUntil] = useState("");

  useEffect(() => {
    const updateTimeUntil = () => {
      const now = new Date();
      const classStart = new Date(classItem.startTime);

      // Extract hours and minutes for time comparison
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const startHour = classStart.getHours();
      const startMinute = classStart.getMinutes();

      // Calculate difference in minutes
      let diffMins = (startHour * 60 + startMinute) - (currentHour * 60 + currentMinute);

      // If negative, assume class is tomorrow (should not happen as this is an upcoming class)
      if (diffMins < 0) {
        diffMins = 0;
      }

      const diffHours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (diffMins <= 0) {
        setTimeUntil("a few moments");
      } else if (diffHours > 0) {
        setTimeUntil(`${diffHours}h ${mins}m`);
      } else {
        setTimeUntil(`${mins}m`);
      }
    };

    updateTimeUntil();
    const intervalId = setInterval(updateTimeUntil, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [classItem.startTime]);

  return <>{timeUntil}</>;
}
