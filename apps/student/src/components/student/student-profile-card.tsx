import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDetails } from "@/hooks/use-student-data";
import { cn } from "@/lib/utils";
import { BadgeInfo, Building2, CalendarCheck, Compass, GraduationCap, Mail, Phone, School, User2, Users } from "lucide-react";
import { ReactNode } from "react";

export function StudentProfileCard() {
  const { data, isLoading, error } = useStudentDetails();

  if (isLoading) {
    return <StudentProfileCardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <BadgeInfo className="h-5 w-5" />
            <span>Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Failed to load your student profile. Please try again later.
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="overflow-hidden border shadow-md h-full">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              <User2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>{data.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{data.rollNo}</p>
            </div>
          </div>
          {data.group && (
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
              Group {data.group.name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-6 md:grid-cols-2">
        {data.section?.semester && (
          <ProfileInfoItem
            icon={<School className="text-emerald-600 dark:text-emerald-400" />}
            label="Current Semester"
            value={`Semester ${data.section.semester}`}
            highlight
          />
        )}

        {data.section && (
          <ProfileInfoItem
            icon={<Users className="text-blue-600 dark:text-blue-400" />}
            label="Section"
            value={data.section.name}
          />
        )}

        {data.section?.batch && (
          <ProfileInfoItem
            icon={<CalendarCheck className="text-purple-600 dark:text-purple-400" />}
            label="Batch"
            value={`${data.section.batch.year}`}
          />
        )}

        {data.section?.batch?.program && (
          <ProfileInfoItem
            icon={<Compass className="text-amber-600 dark:text-amber-400" />}
            label="Program"
            value={`${data.section.batch.program.name}`}
            subvalue={data.section.batch.program.code}
          />
        )}

        {data.section?.batch?.program?.department && (
          <ProfileInfoItem
            icon={<Building2 className="text-indigo-600 dark:text-indigo-400" />}
            label="Department"
            value={data.section.batch.program.department.name}
            subvalue={data.section.batch.program.department.code}
          />
        )}

        <ProfileInfoItem
          icon={<GraduationCap className="text-teal-600 dark:text-teal-400" />}
          label="College"
          value={data.clg}
        />

        {data.email && (
          <ProfileInfoItem
            icon={<Mail className="text-red-600 dark:text-red-400" />}
            label="Email"
            value={data.email}
          />
        )}

        {data.phone && (
          <ProfileInfoItem
            icon={<Phone className="text-green-600 dark:text-green-400" />}
            label="Phone"
            value={data.phone}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProfileInfoItem({
  icon,
  label,
  value,
  subvalue,
  highlight = false
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border p-3 transition-all duration-200",
      "bg-card hover:bg-muted/5",
      highlight && "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900"
    )}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
        {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
      </div>
    </div>
  );
}

function StudentProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[180px]" />
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border p-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
