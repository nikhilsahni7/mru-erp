import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AttendanceSession } from "@/hooks/use-teacher-data";
import { formatShortDate, formatTime } from "@/lib/date-utils";
import { Calendar, ChevronRight, Clock, Users } from "lucide-react";
import Link from "next/link";

interface AttendanceSessionCardProps {
  session: AttendanceSession;
}

export function AttendanceSessionCard({ session }: AttendanceSessionCardProps) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="sm:w-20 flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 text-primary">
          <Calendar className="h-8 w-8 mb-1" />
          <span className="text-xs font-medium">{formatShortDate(session.date)}</span>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{session.course.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
              </div>
              <div>
                Section: {session.section.name}
              </div>
              {session.group && (
                <div>
                  Group: {session.group.name}
                </div>
              )}
              <div>
                {session.componentType}
              </div>
            </div>
            {session.topic && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Topic:</span> {session.topic}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-secondary">
              <div className="text-sm font-medium text-muted-foreground">Total</div>
              <div className="font-bold">{session.statistics.totalStudents}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-sm font-medium text-muted-foreground">Present</div>
              <div className="font-bold text-green-600 dark:text-green-400">{session.statistics.presentCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-sm font-medium text-muted-foreground">Absent</div>
              <div className="font-bold text-red-600 dark:text-red-400">{session.statistics.absentCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-sm font-medium text-muted-foreground">Attendance</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">{session.statistics.attendancePercentage}%</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/attendance/session/${session.id}/mark`}>
                <Users className="h-4 w-4 mr-1" />
                Mark Attendance
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/attendance/session/${session.id}`}>
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
