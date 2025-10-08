import { ApiService } from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Types for the component data
export interface CourseComponent {
  id: string;
  componentType: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  schedules: {
    day: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
  }[];
}

// Form validation schema
export const attendanceFormSchema = z.object({
  componentId: z.string().min(1, "Component ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  topic: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export function useAttendanceCreation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentDay, setCurrentDay] = useState<string>("");

  // Update current day based on selected date
  useEffect(() => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const date = new Date(selectedDate);
    setCurrentDay(days[date.getDay()]);
  }, [selectedDate]);

  // Get components for selected day
  const { data: components, isLoading: componentsLoading } = useQuery<
    CourseComponent[]
  >({
    queryKey: ["components", currentDay],
    queryFn: async () => {
      if (!currentDay) return [];
      const response = await ApiService.getComponents(currentDay);
      return response.data;
    },
    enabled: !!currentDay,
  });

  // Initialize form with default values
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      componentId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
      topic: "",
    },
  });

  // Watch for component changes to auto-fill time fields
  const selectedComponentId = form.watch("componentId");

  // Watch for date changes to update selected date state
  const formDate = form.watch("date");

  useEffect(() => {
    if (formDate && formDate !== selectedDate) {
      setSelectedDate(formDate);
      // Clear component selection when date changes
      form.setValue("componentId", "");
      form.setValue("startTime", "");
      form.setValue("endTime", "");
    }
  }, [formDate, selectedDate, form]);

  useEffect(() => {
    if (components && selectedComponentId) {
      const selectedComponent = components.find(
        (c) => c.id === selectedComponentId
      );

      if (selectedComponent) {
        // If there's a schedule for the selected day, set the times
        const daySchedule = selectedComponent.schedules.find(
          (s) => s.day === currentDay
        );
        if (daySchedule) {
          form.setValue("startTime", daySchedule.startTime);
          form.setValue("endTime", daySchedule.endTime);
        }
      }
    }
  }, [selectedComponentId, components, form, currentDay]);

  // Try to preselect course component if passed in URL
  useEffect(() => {
    if (components && courseParam) {
      const matchedComponent = components.find((c) =>
        c.course.name.toLowerCase().includes(courseParam.toLowerCase())
      );

      if (matchedComponent) {
        form.setValue("componentId", matchedComponent.id);
        // Times will be set by the other useEffect that watches selectedComponentId
      }
    }
  }, [components, courseParam, form]);

  // Create attendance session mutation
  const createSession = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      // Convert time strings to ISO format
      const dateStr = data.date;
      const startTimeISO = new Date(
        `${dateStr}T${data.startTime}`
      ).toISOString();
      const endTimeISO = new Date(`${dateStr}T${data.endTime}`).toISOString();

      const payload = {
        componentId: data.componentId,
        date: dateStr,
        startTime: startTimeISO,
        endTime: endTimeISO,
        topic: data.topic || undefined,
      };

      // Use the correct API endpoint as per documentation
      const response = await ApiService.createAttendanceSession(payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Attendance session created successfully");

      // Handle both formats of successful response:
      // 1. New session: { success: true, data: { id: string, ... } }
      // 2. Existing session: { id: string, ... }

      let sessionId;

      if (data.success && data.data?.id) {
        // Format 1: New session
        sessionId = data.data.id;
      } else if (data.id) {
        // Format 2: Existing session
        sessionId = data.id;
      }

      if (sessionId) {
        // Redirect to marking page with the correct session ID
        router.push(`/dashboard/attendance/session/${sessionId}/mark`);
      } else {
        console.error("Session ID not found in response:", data);
        toast.error("Error finding session ID. Please check attendance list.");
        router.push("/dashboard/attendance");
      }
    },
    onError: (error: any) => {
      console.error("Create session error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create attendance session";
      toast.error(errorMessage);
    },
  });

  // Find the selected component for display
  const selectedComponent = selectedComponentId
    ? components?.find((c) => c.id === selectedComponentId)
    : null;

  // Form submission handler
  const onSubmit = (values: AttendanceFormValues) => {
    createSession.mutate(values);
  };

  return {
    form,
    components,
    componentsLoading,
    selectedComponent,
    currentDay,
    createSession,
    onSubmit,
  };
}
