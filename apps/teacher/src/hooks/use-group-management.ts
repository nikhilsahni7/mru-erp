"use client";

import { ApiService } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string | null;
  phone: string | null;
  group: {
    id: string;
    name: string;
  } | null;
}

export interface Group {
  id: string;
  name: string;
}

export interface SectionWithStudents {
  id: string;
  name: string;
  semester: number;
  program: {
    code: string;
    name: string;
  };
  batch: number;
  availableGroups: Group[];
  students: Student[];
  totalStudents: number;
}

export interface GroupUpdate {
  studentId: string;
  groupId: string | null;
}

export function useSectionsWithStudents() {
  return useQuery<SectionWithStudents[]>({
    queryKey: ["sections", "students"],
    queryFn: async () => {
      const response = await ApiService.getSectionsWithStudents();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateStudentGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: GroupUpdate[]) => {
      const response = await ApiService.updateStudentGroups(updates);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully updated ${data.updated} student group(s)`);
      // Invalidate and refetch sections data
      queryClient.invalidateQueries({ queryKey: ["sections", "students"] });
    },
    onError: (error: any) => {
      console.error("Error updating student groups:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        error?.message ||
        "Failed to update student groups";
      toast.error(errorMessage);
    },
  });
}
