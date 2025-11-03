import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Critical for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const isLoginPage = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname === "/login" || window.location.pathname === "/"
  );
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Endpoints that should NOT trigger token refresh
    const noRetryEndpoints = [
      "/auth/login",
      "/auth/refresh",
      "/auth/logout",
      "/auth/student/login",
      "/auth/teacher/login",
    ];

    const shouldNotRetry = noRetryEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    if (isLoginPage() || shouldNotRetry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshResponse = await api.post("/auth/refresh");
          const newToken = refreshResponse.data.accessToken;

          onRefreshed(newToken);
          isRefreshing = false;

          return api(originalRequest);
        } catch (refreshError: any) {
          isRefreshing = false;
          refreshSubscribers = [];

          if (!isLoginPage() && typeof window !== "undefined") {
            const errorMessage =
              refreshError?.response?.data?.message ||
              "Session expired. Please login again.";
            toast.error(errorMessage);

            setTimeout(() => {
              window.location.href = "/login";
            }, 1500);
          }

          return Promise.reject(refreshError);
        }
      } else {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            resolve(api(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);
export const ApiService = {
  teacherLogin: (credentials: { rollNo: string; password: string }) =>
    api.post("/auth/teacher/login", credentials),

  logout: () => api.post("/auth/logout"),

  getProfile: () => api.get("/user/profile"),

  getCurrentClasses: () => api.get("/teacher/current"),

  getTodayClasses: () => api.get("/teacher/today"),

  getDayTimetable: (day: string) => api.get(`/teacher/timetable/${day}`),

  getComponents: (day: string) => api.get(`/teacher/components/${day}`),

  getTodaySessions: () => api.get("/attendance/today"),

  getAttendanceSession: (sessionId: string) =>
    api.get(`/attendance/session/${sessionId}`),

  getStudentsByComponent: (componentId: string) =>
    api.get(`/attendance/students/${componentId}`),

  createAttendanceSession: (data: {
    componentId: string;
    date: string;
    startTime: string;
    endTime: string;
    topic?: string;
  }) => api.post("/attendance/session", data),

  markAttendance: (data: {
    sessionId: string;
    attendanceRecords: Array<{
      studentId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
      remark?: string;
    }>;
  }) => api.post(`/attendance/mark`, data),

  updateAttendanceRecord: (
    recordId: string,
    data: {
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
      remark?: string;
    }
  ) => api.put(`/attendance/record/${recordId}`, data),

  getAttendanceSessionsByDateRange: (startDate: Date, endDate: Date) =>
    api.get(`/attendance/sessions`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getAttendanceRecord: (recordId: string) =>
    api.get(`/attendance/record/${recordId}`),

  deleteAttendanceSession: (sessionId: string) =>
    api.delete(`/attendance/session/${sessionId}`),

  // New: teacher courses
  getTeacherCourses: () => api.get(`/teacher/courses`),

  // Group management
  getSectionsWithStudents: () => api.get(`/teacher/sections/students`),

  updateStudentGroups: (
    updates: Array<{ studentId: string; groupId: string | null }>
  ) => api.put(`/teacher/students/groups`, { updates }),
};
