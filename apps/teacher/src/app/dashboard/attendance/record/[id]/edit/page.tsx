"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAttendanceRecord, useAttendanceSession, useUpdateAttendanceRecord } from "@/hooks/use-teacher-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertCircle, ArrowLeft, Calendar, Clock, Loader2, Save, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../../../../../lib/axios";

// Validation schema
const formSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE", "EXCUSED"], {
    required_error: "Please select an attendance status",
  }),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditAttendanceRecordPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const [sessionId, setSessionId] = useState<string>("");

  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "ABSENT",
      remark: "",
    },
  });

  // Get record details using the hook
  const {
    data: recordData,
    isLoading: isLoadingRecord,
    error: recordError
  } = useAttendanceRecord(recordId);

  // Session details (for navigation back)
  const { data: sessionData } = useAttendanceSession(sessionId);

  // Set form values when record data is loaded
  useEffect(() => {
    if (recordData) {
      form.setValue("status", recordData.status);
      form.setValue("remark", recordData.remark || "");

      // Store session ID for redirect after update
      if (recordData.session?.id) {
        setSessionId(recordData.session.id);
      }
    }
  }, [recordData, form]);

  // Update record mutation
  const updateRecord = useUpdateAttendanceRecord();

  // Form submission
  const onSubmit = (values: FormValues) => {
    updateRecord.mutate({
      recordId,
      status: values.status,
      remark: values.remark,
    }, {
      onSuccess: (data) => {
        toast.success("Attendance record updated successfully");

        // Navigate back to the session page
        if (sessionId) {
          router.replace(`/dashboard/attendance/session/${sessionId}`);
        } else {
          router.replace("/dashboard/attendance");
        }
      },
      onError: (error: any) => {
        console.error("Update record error:", error);
        const errorMessage = error?.response?.data?.message || "Failed to update attendance record";
        toast.error(errorMessage);
      }
    });
  };

  if (isLoadingRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading attendance record...</p>
      </div>
    );
  }

  if (recordError || !recordData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-medium">Record not found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          {recordError instanceof Error ? recordError.message : "The attendance record you're looking for doesn't exist or you don't have access to it."}
        </p>
        <Button asChild>
          <Link href="/dashboard/attendance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Attendance Record</h1>
          <p className="text-muted-foreground">
            Update attendance status for {recordData.student.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Status</CardTitle>
              <CardDescription>
                Update the attendance status for {recordData.student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Attendance Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="PRESENT" />
                              </FormControl>
                              <FormLabel className="font-normal text-green-600 dark:text-green-400">
                                Present
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="ABSENT" />
                              </FormControl>
                              <FormLabel className="font-normal text-red-600 dark:text-red-400">
                                Absent
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="LATE" />
                              </FormControl>
                              <FormLabel className="font-normal text-amber-600 dark:text-amber-400">
                                Late
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="LEAVE" />
                              </FormControl>
                              <FormLabel className="font-normal text-blue-600 dark:text-blue-400">
                                Leave
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="EXCUSED" />
                              </FormControl>
                              <FormLabel className="font-normal text-indigo-600 dark:text-indigo-400">
                                Excused
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Add any remarks about this student's attendance"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add optional notes about the student's attendance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateRecord.isPending}
                  >
                    {updateRecord.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  {/* Debug button - only show in development */}
                  {process.env.NODE_ENV === "development" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        console.log("Record Data:", recordData);
                        console.log("Session Data:", sessionData);
                        console.log("Form Values:", form.getValues());
                        // Make a direct API request to check the response
                        api.get(`/attendance/record/${recordId}`)
                          .then(response => console.log("API Direct Response:", response.data))
                          .catch(error => console.error("API Direct Error:", error));
                      }}
                    >
                      Debug Data
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Student Info</CardTitle>
              <CardDescription>Details about the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-md bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{recordData.student.name}</h3>
                  <p className="text-sm text-muted-foreground">{recordData.student.rollNo}</p>
                </div>
              </div>

              {recordData.course && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-1">Course</h3>
                  <p className="text-sm">{recordData.course.name}</p>
                  <p className="text-xs text-muted-foreground">{recordData.course.code}</p>
                </div>
              )}

              {recordData.session && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-1">Session Details</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {recordData.session.date ? format(new Date(recordData.session.date), "PPP") : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{recordData.session.componentType}</span>
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
