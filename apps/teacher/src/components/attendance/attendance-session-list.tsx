import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttendanceSession } from "@/hooks/use-teacher-data";
import { format, isToday, parseISO } from "date-fns";
import {
  ArrowUpDown,
  Calendar,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteSessionDialog } from "./delete-session-dialog";

interface AttendanceSessionListProps {
  sessions: AttendanceSession[] | undefined;
  isLoading: boolean;
}

export function AttendanceSessionList({
  sessions,
  isLoading,
}: AttendanceSessionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "course">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [componentFilter, setComponentFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Format date display
  const formatDateDisplay = (dateString: string) => {
    const date = parseISO(dateString);
    return isToday(date) ? "Today" : format(date, "MMM d, yyyy");
  };

  // Format time display
  const formatTimeDisplay = (timeString: string) => {
    return format(new Date(timeString), "h:mm a");
  };

  // Toggle sort direction
  const toggleSort = (field: "date" | "course") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Component types from the data for filtering
  const componentTypes = sessions
    ? [...new Set(sessions.map((s) => s.componentType))]
    : [];

  // Filter and sort sessions
  const filteredSessions = sessions
    ? sessions
        .filter((session) => {
          // Apply search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              session.course.name.toLowerCase().includes(query) ||
              session.course.code.toLowerCase().includes(query) ||
              session.section.name.toLowerCase().includes(query) ||
              (session.group &&
                session.group.name.toLowerCase().includes(query))
            );
          }
          return true;
        })
        .filter((session) => {
          // Apply component type filter
          if (componentFilter) {
            return session.componentType === componentFilter;
          }
          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortBy === "date") {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          } else {
            // Sort by course name
            const nameA = a.course.name.toLowerCase();
            const nameB = b.course.name.toLowerCase();
            return sortDirection === "asc"
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA);
          }
        })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Sessions</CardTitle>
        <CardDescription>
          All attendance sessions{" "}
          {sessions && sessions.length > 0
            ? `for ${format(new Date(sessions[0].date), "MMMM yyyy")}`
            : ""}
        </CardDescription>

        {/* Filters and search */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by course, section, or group"
              className="w-full pl-10 py-2 pr-4 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border rounded-md px-3 py-2"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
            >
              <option value="">All Component Types</option>
              {componentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant="outline"
                className={`px-3 flex items-center ${
                  sortBy === "date" ? "bg-secondary" : ""
                }`}
                onClick={() => toggleSort("date")}
              >
                Date
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`px-3 flex items-center ${
                  sortBy === "course" ? "bg-secondary" : ""
                }`}
                onClick={() => toggleSort("course")}
              >
                Course
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No attendance sessions found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || componentFilter
                ? "Try adjusting your search filters"
                : "Create your first attendance session"}
            </p>
            <Button asChild>
              <Link href="/dashboard/attendance/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Attendance Session
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-3">
                  <Link
                    href={`/dashboard/attendance/session/${session.id}`}
                    className="flex-1"
                  >
                    <div className="font-medium text-lg hover:underline">
                      {session.course.name}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDateDisplay(session.date)}</span>
                      <span className="mx-1">•</span>
                      <span>
                        {formatTimeDisplay(session.startTime)} -{" "}
                        {formatTimeDisplay(session.endTime)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setSessionToDelete({
                          id: session.id,
                          name: `${session.course.name} - ${formatDateDisplay(
                            session.date
                          )}`,
                        });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Link href={`/dashboard/attendance/session/${session.id}`}>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                    <div>Course Code: {session.course.code}</div>
                    <div>Section: {session.section.name}</div>
                    {session.group && <div>Group: {session.group.name}</div>}
                    <div>Type: {session.componentType}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="bg-secondary px-3 py-1 rounded-full text-xs flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{session.statistics.totalStudents} students</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs">
                      Present: {session.statistics.presentCount} (
                      {session.statistics.attendancePercentage}%)
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs">
                      Absent: {session.statistics.absentCount}
                    </div>
                    {session.topic && (
                      <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs">
                        Topic: {session.topic}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}

            {sessionToDelete && (
              <DeleteSessionDialog
                sessionId={sessionToDelete.id}
                sessionName={sessionToDelete.name}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
