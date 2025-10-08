import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AttendanceFormValues,
  CourseComponent,
} from "@/hooks/use-attendance-creation";
import { Calendar, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface CreateSessionFormProps {
  form: UseFormReturn<AttendanceFormValues>;
  onSubmit: (values: AttendanceFormValues) => void;
  isSubmitting: boolean;
  components: CourseComponent[] | undefined;
  componentsLoading: boolean;
}

export function CreateSessionForm({
  form,
  onSubmit,
  isSubmitting,
  components,
  componentsLoading,
}: CreateSessionFormProps) {
  return (
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
                      disabled={componentsLoading || isSubmitting}
                    >
                      <option value="">Select a course component</option>
                      {components?.map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.course.name} - {component.section.name}
                          {component.group ? ` (${component.group.name})` : ""}(
                          {component.componentType})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Select the course component for which you want to mark
                    attendance
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
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select any date for the attendance session (past, present,
                    or future)
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
                      <Input type="time" {...field} disabled={isSubmitting} />
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
                      <Input type="time" {...field} disabled={isSubmitting} />
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
                      disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
  );
}
