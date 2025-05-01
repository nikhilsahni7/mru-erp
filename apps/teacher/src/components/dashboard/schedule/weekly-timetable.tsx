"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { DaySchedule } from "./day-schedule";
import { ClassDetails, WeeklySchedule } from "./types";

interface WeeklyTimetableProps {
  weeklyTimetable: WeeklySchedule;
  isCurrentClass: (schedule: ClassDetails) => boolean;
  isUpcomingClass: (schedule: ClassDetails) => boolean;
  currentDay: string;
}

export function WeeklyTimetable({
  weeklyTimetable,
  isCurrentClass,
  isUpcomingClass,
  currentDay
}: WeeklyTimetableProps) {
  const [selectedDay, setSelectedDay] = useState(currentDay);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Timetable</CardTitle>
        <CardDescription>
          Your complete teaching schedule for the week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay}>
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="MONDAY">Mon</TabsTrigger>
            <TabsTrigger value="TUESDAY">Tue</TabsTrigger>
            <TabsTrigger value="WEDNESDAY">Wed</TabsTrigger>
            <TabsTrigger value="THURSDAY">Thu</TabsTrigger>
            <TabsTrigger value="FRIDAY">Fri</TabsTrigger>
            <TabsTrigger value="SATURDAY">Sat</TabsTrigger>
            <TabsTrigger value="SUNDAY">Sun</TabsTrigger>
          </TabsList>

          {Object.entries(weeklyTimetable).map(([day, schedules]) => (
            <TabsContent key={day} value={day} className="space-y-4 mt-4">
              <DaySchedule
                schedules={schedules}
                day={day}
                isCurrentClass={isCurrentClass}
                isUpcomingClass={isUpcomingClass}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
