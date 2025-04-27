import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTodayClasses } from "@/hooks/use-student-data";
import { ClassScheduleEntry } from "@/lib/student-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Calendar, Clock, MapPin } from "lucide-react";

export function TodayClasses() {
  const { data, isLoading, error } = useTodayClasses();

  // Filter classes to get counts
  const getClassStatusCounts = () => {
    if (!data) return { total: 0, upcoming: 0, inProgress: 0, completed: 0 };

    const now = new Date();
    let upcoming = 0, inProgress = 0, completed = 0;

    data.forEach(classItem => {
      if (isNowInProgress(classItem)) inProgress++;
      else if (isPastClass(classItem)) completed++;
      else upcoming++;
    });

    return {
      total: data.length,
      upcoming,
      inProgress,
      completed
    };
  };

  const counts = getClassStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted"></div>
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>
            ))}
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
          <CardDescription>
            Unable to load today's schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Failed to fetch your class schedule for today. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className="border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-950">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>Today's Schedule</CardTitle>
        </div>
        <CardDescription>
          {data && data.length > 0
            ? `You have ${data.length} class${data.length > 1 ? 'es' : ''} today ${counts.upcoming > 0 ? `(${counts.upcoming} upcoming)` : ''}`
            : 'Your schedule for today'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-3">
        {data && data.length > 0 ? (
          <div className="divide-y">
            {data.map((classItem, i) => (
              <ClassScheduleItem
                key={i}
                classItem={classItem}
                isNow={isNowInProgress(classItem)}
                isPast={isPastClass(classItem)}
                isUpcoming={isUpcomingClass(classItem)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted/30 p-3">
              <Calendar className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium">No Classes Today</p>
            <p className="text-sm text-muted-foreground">
              Enjoy your free day!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClassScheduleItem({
  classItem,
  isNow,
  isPast,
  isUpcoming
}: {
  classItem: ClassScheduleEntry;
  isNow: boolean;
  isPast: boolean;
  isUpcoming: boolean;
}) {
  // Format time for readable display
  const startTime = new Date(classItem.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const endTime = new Date(classItem.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Calculate time until class starts (for upcoming classes)
  const getTimeUntil = () => {
    if (!isUpcoming) return "";

    const now = new Date();
    const classStart = new Date(classItem.startTime);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const startHour = classStart.getHours();
    const startMinute = classStart.getMinutes();

    // Calculate difference in minutes
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const diffMins = startTimeInMinutes - currentTimeInMinutes;

    if (diffMins <= 0) return "now";

    const diffHours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (diffHours > 0) {
      return `in ${diffHours}h ${mins}m`;
    } else {
      return `in ${mins}m`;
    }
  };

  return (
    <div
      className={cn(
        "relative px-6 py-4 transition-colors",
        isNow && "bg-emerald-50/50 dark:bg-emerald-950/30",
        isPast && "bg-muted/30 text-muted-foreground",
        isUpcoming && "bg-amber-50/20 dark:bg-amber-950/10"
      )}
    >
      {/* Vertical line indicator for status */}
      <div className={cn(
        "absolute inset-y-0 left-0 w-1",
        isNow && "bg-emerald-500",
        isPast && "bg-muted-foreground/30",
        isUpcoming && "bg-amber-500"
      )} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {isNow && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                In Progress
              </Badge>
            )}
            {isPast && (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                Completed
              </Badge>
            )}
            {isUpcoming && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                Coming Up {getTimeUntil()}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium uppercase",
                isPast ? "border-muted-foreground/30" : "border-muted"
              )}
            >
              {classItem.componentType.toLowerCase()}
            </Badge>
          </div>

          <h3 className={cn(
            "text-lg font-semibold",
            isPast && "text-muted-foreground"
          )}>
            {classItem.courseName}
          </h3>

          <p className="text-sm text-muted-foreground">
            {classItem.courseCode}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5",
            isPast ? "border-muted-foreground/20" : "border-muted bg-muted/10"
          )}>
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Room {classItem.roomNumber || 'TBA'}
            </span>
          </div>

          <div className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5",
            isPast ? "border-muted-foreground/20" : "border-muted bg-muted/10"
          )}>
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {startTime} - {endTime}
            </span>
          </div>
        </div>
      </div>

      {classItem.teacher && (
        <div className="mt-2 text-sm text-muted-foreground">
          Instructor: {classItem.teacher.name}
        </div>
      )}
    </div>
  );
}

// Check if class is currently in progress
function isNowInProgress(classItem: ClassScheduleEntry): boolean {
  const now = new Date();
  const startTime = new Date(classItem.startTime);
  const endTime = new Date(classItem.endTime);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const startHour = startTime.getHours();
  const startMinute = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();

  // Convert all times to minutes for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  // Class is in progress if current time is between start and end time
  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
}

// Check if class is in the past
function isPastClass(classItem: ClassScheduleEntry): boolean {
  const now = new Date();
  const endTime = new Date(classItem.endTime);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();

  // Convert times to minutes for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  // Class is in the past if end time is before current time
  return currentTimeInMinutes >= endTimeInMinutes;
}

// New helper function to check if a class is upcoming
function isUpcomingClass(classItem: ClassScheduleEntry): boolean {
  return !isNowInProgress(classItem) && !isPastClass(classItem);
}
