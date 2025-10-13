"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { ClassDetails } from "./types";
import { formatTime } from "./utils";

interface DayScheduleProps {
  schedules: ClassDetails[];
  day: string;
  isCurrentClass: (schedule: ClassDetails) => boolean;
  isUpcomingClass: (schedule: ClassDetails) => boolean;
}

export function DaySchedule({
  schedules,
  day,
  isCurrentClass,
  isUpcomingClass,
}: DayScheduleProps) {
  if (schedules.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          No classes scheduled for {day.toLowerCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort schedules by start time */}
      {schedules
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((schedule, index) => (
          <div
            key={`${schedule.courseCode}-${schedule.startTime}-${index}`}
            className={cn(
              "p-4 rounded-lg border bg-card",
              isCurrentClass(schedule) &&
                "border-green-500 bg-green-50 dark:bg-green-950/20",
              isUpcomingClass(schedule) &&
                "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
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
                    {formatTime(schedule.startTime)} -{" "}
                    {formatTime(schedule.endTime)}
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
                    <Link
                      href={`/dashboard/attendance/create?componentId=${schedule.componentId}&startTime=${schedule.startTime}&endTime=${schedule.endTime}`}
                    >
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
  );
}
