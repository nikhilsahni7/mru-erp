"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ClassScheduleEntry {
  courseCode: string;
  courseName: string;
  componentType: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  section: {
    name: string;
    program: string;
    batch: number;
  };
  group: {
    name: string;
  } | null;
}

export interface ClassesResponse {
  currentClass: ClassScheduleEntry | null;
  upcomingClasses: ClassScheduleEntry[];
}

export interface Component {
  id: string;
  componentType: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  schedules: {
    day: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
  }[];
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  group: {
    id: string;
    name: string;
  };
}

export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
  remark?: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
  componentId: string;
  componentType: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
  };
  records: {
    id: string;
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
    remark?: string;
    student: Student;
  }[];
}

export function useCurrentClasses() {
  return useQuery({
    queryKey: ["teacher", "current-classes"],
    queryFn: async (): Promise<ClassesResponse> => {
      const response = await api.get("/teacher/current");
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute to keep current class updated
  });
}

export function useTodayClasses() {
  return useQuery({
    queryKey: ["teacher", "today-classes"],
    queryFn: async (): Promise<ClassScheduleEntry[]> => {
      const response = await api.get("/teacher/today");
      return response.data;
    },
  });
}

export function useDayTimetable(day: string) {
  return useQuery({
    queryKey: ["teacher", "timetable", day],
    queryFn: async (): Promise<ClassScheduleEntry[]> => {
      const response = await api.get(`/teacher/timetable/${day}`);
      return response.data;
    },
    enabled: !!day,
  });
}

export function useComponents(day: string) {
  return useQuery({
    queryKey: ["teacher", "components", day],
    queryFn: async (): Promise<Component[]> => {
      const response = await api.get(`/teacher/components/${day}`);
      return response.data;
    },
    enabled: !!day,
  });
}


export function useTodaySessions() {
  return useQuery({
    queryKey: ["teacher", "attendance", "today"],
    queryFn: async (): Promise<AttendanceSession[]> => {
      const response = await api.get(`/attendance/today`);
      return response.data;
    },
  });
}

export function useAttendanceSession(sessionId: string) {
  return useQuery({
    queryKey: ["attendance", "session", sessionId],
    queryFn: async () => {
      try {
        console.log("Fetching attendance session:", sessionId);
        if (!sessionId) {
          console.warn("No sessionId provided to useAttendanceSession");
          return null;
        }
        const response = await api.get(`/attendance/session/${sessionId}`);
        console.log("Attendance session API response:", response.data);

        // Validate that the response contains records
        if (!response.data?.records) {
          console.warn("Session data doesn't contain records", response.data);
        }

        return response.data;
      } catch (error) {
        console.error("Error fetching attendance session:", error);
        throw error;
      }
    },
    enabled: !!sessionId,
    staleTime: 30000, // 30 seconds
    retry: 2
  })
}

export function useStudentsByComponent(componentId: string) {
  return useQuery({
    queryKey: ["attendance", "students", componentId],
    queryFn: async (): Promise<Student[]> => {
      try {
        console.log("Fetching students for componentId:", componentId);
        if (!componentId) {
          console.warn("No componentId provided to useStudentsByComponent");
          return [];
        }
        const response = await api.get(`/attendance/students/${componentId}`);
        console.log("Students API response:", response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching students:", error);
        return []; // Return empty array on error for better UX
      }
    },
    enabled: !!componentId,
  });
}

// New hooks for attendance functionality

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      componentId: string;
      date: string;
      startTime: string;
      endTime: string;
      topic?: string;
    }) => {
      const response = await api.post('/attendance/session', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "attendance", "today"] });
      return data;
    }
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      attendanceRecords: AttendanceRecord[]
    }) => {
      const response = await api.post(`/attendance/mark`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific session query
      queryClient.invalidateQueries({
        queryKey: ["attendance", "session", variables.sessionId]
      });
      // Also invalidate today's sessions
      queryClient.invalidateQueries({
        queryKey: ["teacher", "attendance", "today"]
      });
    }
  });
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      recordId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
      remark?: string;
    }) => {
      const response = await api.put(`/attendance/record/${data.recordId}`, {
        status: data.status,
        remark: data.remark
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Record updated successfully:", data);

      const sessionId = data.session?.id;

      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["attendance", "session", sessionId]
        });

        queryClient.invalidateQueries({
          queryKey: ["teacher", "attendance", "today"]
        });
      }
    }
  });
}

export function useAttendanceSessionsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["attendance", "sessions", startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<AttendanceSession[]> => {
      const response = await api.get(`/attendance/sessions`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate
  });
}

// New hook to fetch a single attendance record
export function useAttendanceRecord(recordId: string) {
  return useQuery({
    queryKey: ["attendance", "record", recordId],
    queryFn: async () => {
      if (!recordId) throw new Error("Record ID is required");
      const response = await api.get(`/attendance/record/${recordId}`);
      return response.data;
    },
    enabled: !!recordId,
  });
}
