import axios, { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies if needed
    // const token = localStorage.getItem("accessToken");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if the error is due to an expired token
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;

      try {
        // Call refresh token endpoint
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token is also expired, redirect to login
        console.error("Refresh token failed:", refreshError);
        // Handle logout/redirect to login here
        if (typeof window !== "undefined") {
          toast.error("Your session has expired. Please login again.");
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
        return Promise.reject(refreshError);
      }
    }

    // Return any other error
    return Promise.reject(error);
  }
);

// Create service functions for API calls
export const ApiService = {


  // Teacher LoginCredentials
  teacherLogin: (credentials: { rollNo: string; password: string }) =>
    api.post("/auth/teacher/login", credentials),

  logout: () =>
    api.post("/auth/logout"),

  // Use the user/profile endpoint that correctly handles role-based profiles
  getProfile: () =>
    api.get("/user/profile"),

  // Teacher endpoints
  getCurrentClasses: () =>
    api.get("/teacher/current"),

  getTodayClasses: () =>
    api.get("/teacher/today"),

  getDayTimetable: (day: string) =>
    api.get(`/teacher/timetable/${day}`),

  getComponents: (day: string) =>
    api.get(`/teacher/components/${day}`),

  // Attendance endpoints
  getTodaySessions: () =>
    api.get("/attendance/today"),

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
  }) =>
    api.post('/attendance/session', data),

  markAttendance: (data: {
    sessionId: string;
    attendanceRecords: Array<{
      studentId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
      remark?: string;
    }>;
  }) =>
    api.post(`/attendance/mark`, data),

  updateAttendanceRecord: (recordId: string, data: {
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "EXCUSED";
    remark?: string;
  }) =>
    api.put(`/attendance/record/${recordId}`, data),

  getAttendanceSessionsByDateRange: (startDate: Date, endDate: Date) =>
    api.get(`/attendance/sessions`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }),

  getAttendanceRecord: (recordId: string) =>
    api.get(`/attendance/record/${recordId}`),
};
