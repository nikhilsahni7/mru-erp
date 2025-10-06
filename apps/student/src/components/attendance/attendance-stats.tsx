"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AttendanceStatsProps {
  stats: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
  } | null;
  courseWiseStats?: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
  }> | null;
  showTitle?: boolean;
  title?: string;
}

export function AttendanceStats({
  stats,
  courseWiseStats,
  showTitle = false,
  title = "Attendance Statistics",
}: AttendanceStatsProps) {
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-600";
    if (percentage >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      {stats && (
        <Card className="p-6">
          {showTitle && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Sessions
              </p>
              <p className="text-3xl font-bold">{stats.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Present</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.presentCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.absentCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  getPercentageColor(stats.percentage)
                )}
              >
                {stats.percentage.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Progress
              value={stats.percentage}
              className="h-3"
              indicatorClassName={getProgressColor(stats.percentage)}
            />
          </div>
        </Card>
      )}

      {/* Course-wise Stats */}
      {courseWiseStats && courseWiseStats.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course-wise Attendance</h2>
          <div className="space-y-4">
            {courseWiseStats.map((course) => (
              <div key={course.courseId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{course.courseCode}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.courseName}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      getPercentageColor(course.percentage)
                    )}
                  >
                    {course.percentage.toFixed(2)}%
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-medium">{course.totalSessions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Present:</span>{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {course.presentCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Absent:</span>{" "}
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {course.absentCount}
                    </span>
                  </div>
                </div>
                <Progress
                  value={course.percentage}
                  className="h-2"
                  indicatorClassName={getProgressColor(course.percentage)}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
