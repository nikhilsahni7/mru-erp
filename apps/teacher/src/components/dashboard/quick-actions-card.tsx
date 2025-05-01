import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, GraduationCap } from "lucide-react";
import Link from "next/link";

export function QuickActionsCard() {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for faculty</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/dashboard/attendance" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
          <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">Mark Attendance</h4>
            <p className="text-sm text-muted-foreground">Record student attendance for your classes</p>
          </div>
        </Link>

        <Link href="/dashboard/schedule" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
          <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">View Timetable</h4>
            <p className="text-sm text-muted-foreground">Check your weekly teaching schedule</p>
          </div>
        </Link>

        <Link href="/dashboard/profile" className="flex items-center p-3 border rounded-lg hover:bg-secondary transition-colors">
          <div className="p-2 rounded-md bg-primary/10 text-primary mr-4">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">Academic Profile</h4>
            <p className="text-sm text-muted-foreground">Manage your faculty profile and details</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
