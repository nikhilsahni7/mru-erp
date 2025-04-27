import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeeklyTimetable } from "@/hooks/use-student-data";
import { ClassScheduleEntry } from "@/lib/student-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WeeklyTimetable() {
  const { data, isLoading, error, loadingProgress, refetch } = useWeeklyTimetable();
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

  // Get the current day of the week as a tab value
  function getCurrentDay() {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = new Date().getDay();
    return days[today];
  }

  // Handle tab navigation with arrow keys
  const navigateDay = (direction: "prev" | "next") => {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const currentIndex = days.indexOf(selectedDay);
    let newIndex;

    if (direction === "prev") {
      newIndex = currentIndex <= 0 ? days.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= days.length - 1 ? 0 : currentIndex + 1;
    }

    setSelectedDay(days[newIndex]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span>Weekly Timetable</span>
          </CardTitle>
          <CardDescription>
            Loading your weekly class schedule...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-lg font-medium text-purple-700 dark:text-purple-400">{loadingProgress}</p>
            </div>

            <Progress value={isLoading ? 80 : 100} className="w-full max-w-md h-2" />

            <p className="text-sm text-muted-foreground mt-4 max-w-md">
              The timetable includes data for all days and courses which may take a moment to load.
              Thank you for your patience.
            </p>
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
          <p className="mb-4">Failed to load your weekly timetable. {error.message || 'Please try again later.'}</p>
          <Button
            onClick={() => {
              toast.info("Retrying timetable fetch...");
              refetch();
            }}
            variant="outline"
            disabled={isLoading}
            className="mt-2"
          >
            {isLoading ?
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> :
              'Retry'
            }
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="col-span-full border shadow-md">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-purple-100 p-1.5 dark:bg-purple-950">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Weekly Timetable</CardTitle>
        </div>
        <CardDescription>
          Your weekly class schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium">{selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          defaultValue={selectedDay}
          value={selectedDay}
          onValueChange={setSelectedDay}
          className="w-full"
        >
          <TabsList className="hidden md:flex mb-4 w-full">
            {Object.keys(data).map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="flex-1"
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(data).map(([day, classes]) => (
            <TabsContent key={day} value={day} className="mt-0">
              {classes.length > 0 ? (
                <div className="space-y-4">
                  {classes.map((classItem, i) => (
                    <TimeTableClassCard key={i} classItem={classItem} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
                  <Calendar className="mb-2 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-lg font-medium">No Classes</p>
                  <p className="text-sm text-muted-foreground">
                    You don't have any scheduled classes on {day.charAt(0) + day.slice(1).toLowerCase()}.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TimeTableClassCard({ classItem }: { classItem: ClassScheduleEntry }) {
  // Format times for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Component type to badge styling
  const componentTypeColors = {
    LECTURE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    TUTORIAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    LABORATORY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
    PRACTICAL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
    SEMINAR: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    PROJECT: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  } as const;

  const componentColor = componentTypeColors[classItem.componentType as keyof typeof componentTypeColors] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 border-gray-200 dark:border-gray-700";

  return (
    <div className={cn(
      "flex flex-col space-y-2 rounded-lg border p-4 shadow-sm transition-all duration-200 hover:shadow-md",
      "bg-card",
      "border-l-4", componentColor.split(' ').find(cls => cls.startsWith('border-'))
    )}>
      <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-1">
          {/* Course name and badge */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-base sm:text-lg">{classItem.courseName}</h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium uppercase border px-2 py-0.5",
                componentColor
              )}
            >
              {classItem.componentType.toLowerCase()}
            </Badge>
          </div>

          {/* Time display */}
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>{formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}</span>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center rounded-md border border-muted bg-muted/10 px-3 py-2">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Room</p>
            <p className="font-medium text-sm">{classItem.roomNumber || 'TBA'}</p>
          </div>
        </div>

        <div className="flex items-center rounded-md border border-muted bg-muted/10 px-3 py-2">
          <BookOpen className="mr-2 h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Course</p>
            <p className="font-medium text-sm">{classItem.courseCode}</p>
          </div>
        </div>

        <div className="flex items-center rounded-md border border-muted bg-muted/10 px-3 py-2">
          <User className="mr-2 h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Teacher</p>
            <p className="font-medium text-sm">{classItem.teacher.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
