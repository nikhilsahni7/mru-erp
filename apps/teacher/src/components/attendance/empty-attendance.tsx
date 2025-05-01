import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";

export function EmptyAttendance() {
  return (
    <div className="bg-card border rounded-xl p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Calendar className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">No attendance sessions today</h3>
      <p className="text-muted-foreground mb-6">
        You haven't created any attendance sessions for today yet.
      </p>
      <Button asChild>
        <Link href="/dashboard/attendance/create">
          <Calendar className="h-4 w-4 mr-2" />
          Create Attendance Session
        </Link>
      </Button>
    </div>
  );
}
