"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export type DateRange = "today" | "custom";

interface AttendanceFiltersProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  customStartDate: Date | undefined;
  setCustomStartDate: (date: Date | undefined) => void;
  customEndDate: Date | undefined;
  setCustomEndDate: (date: Date | undefined) => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string | null) => void;
  courses: any[];
  showCourseFilter?: boolean;
  showDateRange?: boolean;
}

export function AttendanceFilters({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  selectedCourseId,
  setSelectedCourseId,
  courses,
  showCourseFilter = true,
  showDateRange = true,
}: AttendanceFiltersProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Date Range Selector */}
        {showDateRange && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="flex gap-2">
              <Button
                variant={dateRange === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("today")}
              >
                Today
              </Button>
              <Button
                variant={dateRange === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange("custom")}
              >
                Custom Range
              </Button>
            </div>
          </div>
        )}

        {/* Custom Date Range Picker */}
        {showDateRange && dateRange === "custom" && (
          <>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate
                      ? format(customStartDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate
                      ? format(customEndDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Course Filter */}
        {showCourseFilter && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Filter by Course
            </label>
            <Select
              value={selectedCourseId || "all"}
              onValueChange={(value) =>
                setSelectedCourseId(value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseCode} - {course.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
}
