import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronRight, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";

interface ClassInfo {
  courseCode: string;
  courseName: string;
  startTime: string;
  endTime: string;
  section: {
    name: string;
  };
  group: {
    name: string;
  } | null;
  roomNumber: string;
}

interface ClassScheduleCardProps {
  currentClass: ClassInfo | null;
  upcomingClasses: ClassInfo[] | null;
  formatTimeFromString: (time: string) => string;
}

export function ClassScheduleCard({
  currentClass,
  upcomingClasses,
  formatTimeFromString
}: ClassScheduleCardProps) {
  return (
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
          {currentClass && (
            <div className="flex items-start border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="mr-4 mt-1 p-2 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <Clock className="h-4 w-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between">
                  <p className="font-medium">{currentClass.courseName} <span className="text-sm text-green-600 dark:text-green-400">(Current)</span></p>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeFromString(currentClass.startTime)} - {formatTimeFromString(currentClass.endTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Section: {currentClass.section.name}</span>
                  {currentClass.group && (
                    <>
                      <span>•</span>
                      <span>Group: {currentClass.group.name}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Room: {currentClass.roomNumber}</span>
                </div>
                <div className="flex mt-3 space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/attendance/create?course=${currentClass.courseCode}`}>
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

          {upcomingClasses && upcomingClasses.map((cls, index) => (
            <div key={`${cls.courseCode}-${cls.startTime}-${index}`} className="flex items-start border rounded-lg p-3">
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

          {(!currentClass && (!upcomingClasses || upcomingClasses.length === 0)) && (
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
  );
}
