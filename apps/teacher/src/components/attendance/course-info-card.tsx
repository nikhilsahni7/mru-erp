import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseComponent } from "@/hooks/use-attendance-creation";
import { format } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";

interface CourseInfoCardProps {
  selectedComponent: CourseComponent | null;
  isLoading: boolean;
  currentDay: string;
}

export function CourseInfoCard({
  selectedComponent,
  isLoading,
  currentDay
}: CourseInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Course Info</CardTitle>
        <CardDescription>
          Details about the selected course component
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
  );
}
