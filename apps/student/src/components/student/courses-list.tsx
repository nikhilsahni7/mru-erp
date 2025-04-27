import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useStudentCourses } from "@/hooks/use-student-data";
import { CourseInfo } from "@/lib/student-api";
import { AlertTriangle, BookOpen, GraduationCap, Search, User } from "lucide-react";
import { useState } from "react";

export function CoursesList() {
  const { data, isLoading, error } = useStudentCourses();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter courses based on search query
  const filteredCourses = data?.filter(course => {
    const query = searchQuery.toLowerCase();
    return (
      course.name.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query) ||
      course.mainTeacher.name.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted"></div>
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-10 w-full animate-pulse rounded-md bg-muted"></div>
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-muted"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Failed to load your courses. Please try again later.
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>My Courses</span>
          </CardTitle>
          <CardDescription>
            Courses you're currently enrolled in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="mb-2 h-12 w-12 text-muted-foreground/60" />
            <p className="text-lg font-medium">No Courses Found</p>
            <p className="text-sm text-muted-foreground">
              You are not enrolled in any courses for the current semester.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>My Courses</span>
        </CardTitle>
        <CardDescription>
          {`${data.length} course${data.length !== 1 ? 's' : ''} for the current semester`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses by name, code or teacher..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredCourses && filteredCourses.length > 0 ? (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-2 h-10 w-10 text-muted-foreground/60" />
            <p className="text-lg font-medium">No Matching Courses</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: CourseInfo }) {
  return (
    <Collapsible className="rounded-lg border shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{course.name}</h3>
              <Badge variant="outline" className="text-xs">
                {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Code: {course.code}</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <span className="text-xs">Details</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform ui-open:rotate-180"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Primary Instructor: {course.mainTeacher.name}</span>
        </div>
      </div>
      <CollapsibleContent>
        <div className="border-t p-4">
          <h4 className="mb-2 text-sm font-medium">Course Components</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {course.componentTypes.map((component, idx) => (
              <div key={idx} className="rounded-md border p-2">
                <p className="text-xs font-medium uppercase">{component.type}</p>
                <p className="text-xs text-muted-foreground">
                  Instructor: {component.teacher.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
