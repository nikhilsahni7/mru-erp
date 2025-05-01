"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, Calendar, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Types for the component data
interface CourseComponent {
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

// Format the validation schema
const formSchema = z.object({
  componentId: z.string().min(1, "Component ID is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  topic: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");

  const [currentDay, setCurrentDay] = useState<string>("");

  useEffect(() => {
    // Get current day of week
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    setCurrentDay(days[new Date().getDay()]);
  }, []);

  // Get components for today
  const { data: components, isLoading: componentsLoading } = useQuery<CourseComponent[]>({
    queryKey: ["components", currentDay],
    queryFn: async () => {
      if (!currentDay) return [];
      const response = await api.get(`/teacher/components/${currentDay}`);
      return response.data;
    },
    enabled: !!currentDay,
  });

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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

  useEffect(() => {
    if (components && selectedComponentId) {
      const selectedComponent = components.find(c => c.id === selectedComponentId);

      if (selectedComponent) {
        // If there's a schedule for today, set the times
        const todaySchedule = selectedComponent.schedules.find(s => s.day === currentDay);
        if (todaySchedule) {
          form.setValue("startTime", todaySchedule.startTime);
          form.setValue("endTime", todaySchedule.endTime);
        }
      }
    }
  }, [selectedComponentId, components, form, currentDay]);

  // Try to preselect course component if passed in URL
  useEffect(() => {
    if (components && courseParam) {
      const matchedComponent = components.find(c =>
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
    mutationFn: async (data: FormValues) => {
      // Convert time strings to ISO format
      const dateStr = data.date;
      const startTimeISO = new Date(`${dateStr}T${data.startTime}`).toISOString();
      const endTimeISO = new Date(`${dateStr}T${data.endTime}`).toISOString();

      const payload = {
        componentId: data.componentId,
        date: dateStr,
        startTime: startTimeISO,
        endTime: endTimeISO,
        topic: data.topic || undefined,
      };

      console.log("Creating attendance session with payload:", payload);
      // Use the correct API endpoint as per documentation
      const response = await api.post("/attendance/session", payload);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Attendance session response:", data);
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
        router.push('/dashboard/attendance');
      }
    },
    onError: (error: any) => {
      console.error("Create session error:", error);
      console.error("Error response:", error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create attendance session";
      toast.error(errorMessage);
    },
  });

  const onSubmit = (values: FormValues) => {
    createSession.mutate(values);
  };

  // Find the selected component for display
  const selectedComponent = form.watch("componentId")
    ? components?.find(c => c.id === form.watch("componentId"))
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Attendance Session</h1>
          <p className="text-muted-foreground">
            Set up a new attendance session for your class
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="self-start"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>
                Enter the details for the attendance session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Course Component Selection */}
                  <FormField
                    control={form.control}
                    name="componentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Component</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 border rounded-md bg-background"
                            disabled={componentsLoading || createSession.isPending}
                          >
                            <option value="">Select a course component</option>
                            {components?.map((component) => (
                              <option key={component.id} value={component.id}>
                                {component.course.name} - {component.section.name}
                                {component.group ? ` (${component.group.name})` : ''}
                                ({component.componentType})
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormDescription>
                          Select the course component for which you want to mark attendance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Selection */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              {...field}
                              className="pl-10"
                              disabled={createSession.isPending}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Date for the attendance session
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Selection */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              disabled={createSession.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              disabled={createSession.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Topic (Optional) */}
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter the topic covered in this session"
                            {...field}
                            disabled={createSession.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          Helps you track what was covered in this session
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="mt-6 w-full sm:w-auto"
                    disabled={createSession.isPending}
                  >
                    {createSession.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Attendance Session"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Selected Course Info</CardTitle>
              <CardDescription>
                Details about the selected course component
              </CardDescription>
            </CardHeader>
            <CardContent>
              {componentsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              ) : !selectedComponent ? (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Select a course component to see details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedComponent.course.name}</h3>
                    <p className="text-muted-foreground">{selectedComponent.course.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="font-medium">Section</p>
                      <p className="text-muted-foreground">{selectedComponent.section.name}</p>
                    </div>
                    {selectedComponent.group && (
                      <div>
                        <p className="font-medium">Group</p>
                        <p className="text-muted-foreground">{selectedComponent.group.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">Component Type</p>
                      <p className="text-muted-foreground">{selectedComponent.componentType}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Schedules</p>
                    {selectedComponent.schedules.length > 0 ? (
                      <div className="space-y-2">
                        {selectedComponent.schedules.map((schedule, idx) => {
                          // Parse the time strings to extract hours and minutes
                          const formatTimeString = (timeStr: string) => {
                            const [hours, minutes] = timeStr.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours, minutes, 0, 0);
                            return date;
                          };

                          // Create proper date objects from the time strings
                          const start = formatTimeString(schedule.startTime);
                          const end = formatTimeString(schedule.endTime);

                          return (
                            <div
                              key={idx}
                              className={`p-2 border rounded-md text-sm ${
                                schedule.day === currentDay
                                  ? 'bg-primary/10 border-primary/30'
                                  : ''
                              }`}
                            >
                              <div className="font-medium">{schedule.day}</div>
                              <div className="flex justify-between mt-1">
                                <span>{format(start, "hh:mm a")} - {format(end, "hh:mm a")}</span>
                                <span>Room: {schedule.roomNumber}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No schedules available</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
