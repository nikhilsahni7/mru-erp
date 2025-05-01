"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { CourseInfoCard } from "@/components/attendance/course-info-card";
import { CreateSessionForm } from "@/components/attendance/create-session-form";
import { CourseComponent, useAttendanceCreation } from "@/hooks/use-attendance-creation";

export default function CreateAttendancePage() {
  const {
    form,
    components,
    componentsLoading,
    selectedComponent,
    currentDay,
    createSession,
    onSubmit
  } = useAttendanceCreation();

  // Ensure selectedComponent is properly typed for CourseInfoCard
  const typedSelectedComponent: CourseComponent | null = selectedComponent || null;

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Create Attendance Session"
        description="Set up a new attendance session for your class"
        showBackButton
        backHref="/dashboard/attendance"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CreateSessionForm
            form={form}
            onSubmit={onSubmit}
            isSubmitting={createSession.isPending}
            components={components}
            componentsLoading={componentsLoading}
          />
        </div>

        <div>
          <CourseInfoCard
            selectedComponent={typedSelectedComponent}
            isLoading={componentsLoading}
            currentDay={currentDay}
          />
        </div>
      </div>
    </div>
  );
}
