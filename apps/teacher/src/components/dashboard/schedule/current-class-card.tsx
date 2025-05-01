"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";
import { ClassDetails } from "./types";
import { formatTime } from "./utils";

interface CurrentClassCardProps {
  currentClass: ClassDetails | null;
  upcomingClasses: ClassDetails[];
}

export function CurrentClassCard({ currentClass, upcomingClasses }: CurrentClassCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle>Current/Upcoming Class</CardTitle>
        <CardDescription>
          Your immediate teaching responsibilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Class */}
          <div className="p-4 rounded-lg border bg-secondary/50">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-muted-foreground text-sm">Current Class</div>
              <div className="p-1.5 rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </div>

            {currentClass ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold line-clamp-1">
                  {currentClass.courseName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentClass.startTime)} - {formatTime(currentClass.endTime)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {currentClass.section.name}
                  </span>
                  {currentClass.group && (
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      Group {currentClass.group.name}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {currentClass.roomNumber}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {currentClass.componentType}
                  </span>
                </div>
                <div className="mt-3">
                  <Button asChild size="sm">
                    <Link href={`/dashboard/attendance/create?course=${currentClass.courseCode}`}>
                      <ClipboardList className="h-3.5 w-3.5 mr-1" />
                      Mark Attendance
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No class is currently in session
              </div>
            )}
          </div>

          {/* Next Class */}
          <div className="p-4 rounded-lg border bg-secondary/50">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-muted-foreground text-sm">Next Class</div>
              <div className="p-1.5 rounded-full bg-primary/10">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>

            {upcomingClasses && upcomingClasses.length > 0 ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold line-clamp-1">
                  {upcomingClasses[0].courseName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(upcomingClasses[0].startTime)} - {formatTime(upcomingClasses[0].endTime)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {upcomingClasses[0].section.name}
                  </span>
                  {upcomingClasses[0].group && (
                    <span className="px-2 py-1 rounded-full bg-secondary border">
                      Group {upcomingClasses[0].group.name}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {upcomingClasses[0].roomNumber}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-secondary border">
                    {upcomingClasses[0].componentType}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No upcoming classes for today
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
