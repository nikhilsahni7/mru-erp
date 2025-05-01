import { Button } from "@/components/ui/button";
import { Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";

interface WelcomeHeaderProps {
  userName: string;
  currentDate: string;
  currentTime: string;
}

export function WelcomeHeader({ userName, currentDate, currentTime }: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Welcome Back, {userName || "Professor"}</h1>
        <p className="text-muted-foreground">
          {currentDate} | {currentTime}
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/schedule">
            <Calendar className="h-4 w-4 mr-2" />
            View Schedule
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/attendance">
            <ClipboardList className="h-4 w-4 mr-2" />
            Mark Attendance
          </Link>
        </Button>
      </div>
    </div>
  );
}
