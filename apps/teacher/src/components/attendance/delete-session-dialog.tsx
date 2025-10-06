"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiService } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteSessionDialogProps {
  sessionId: string;
  sessionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess?: () => void;
}

export function DeleteSessionDialog({
  sessionId,
  sessionName,
  open,
  onOpenChange,
  onDeleteSuccess,
}: DeleteSessionDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await ApiService.deleteAttendanceSession(sessionId);
    },
    onSuccess: () => {
      toast.success("Attendance session deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["attendanceSessions"] });
      onOpenChange(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete attendance session"
      );
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            attendance session for <strong>{sessionName}</strong> and all
            associated attendance records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
