"use client";

import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { DeleteSessionDialog } from "@/components/attendance/delete-session-dialog";
import { SessionDetails } from "@/components/attendance/session-details";
import { Button } from "@/components/ui/button";
import { ApiService } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Download, FileEdit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SessionDetailPage({ params }: SessionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch session details to get the name
  const { data: session } = useQuery({
    queryKey: ["attendanceSession", id],
    queryFn: async () => {
      const response = await ApiService.getAttendanceSession(id);
      return response.data;
    },
  });

  const handleDeleteSuccess = () => {
    router.push("/dashboard/attendance");
  };

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
      <Button
        variant="outline"
        onClick={() => setDeleteDialogOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
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

      {session && (
        <DeleteSessionDialog
          sessionId={id}
          sessionName={`${session.course.name} - ${new Date(
            session.date
          ).toLocaleDateString()}`}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
