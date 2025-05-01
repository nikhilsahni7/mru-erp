"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { SessionDetails } from "@/components/attendance/session-details";
import { Button } from "@/components/ui/button";
import { Download, FileEdit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default function SessionDetailPage({ params }: SessionPageProps) {
  // For Next.js compatibility, we'll use direct access for now
  const { id } = params;

  const router = useRouter();

  const headerActions = (
    <>
      <Button asChild variant="outline">
        <Link href={`/dashboard/attendance/session/${id}/mark`}>
          <FileEdit className="h-4 w-4 mr-2" />
          Edit Attendance
        </Link>
      </Button>
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </>
  );

  return (
    <div className="space-y-8">
      <AttendanceHeader
        title="Attendance Session"
        description="View session details and attendance records"
        showBackButton
        backHref="/dashboard/attendance"
        actions={headerActions}
      />

      <SessionDetails sessionId={id} />
    </div>
  );
}
