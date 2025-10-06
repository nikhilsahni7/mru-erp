import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,

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
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

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

// Attendance API methods
export const attendanceApi = {
  // Get today's attendance
  getTodayAttendance: async () => {
    const response = await api.get("/student/attendance/today");
    return response.data;
  },

  // Get attendance by date range
  getAttendanceByDateRange: async (startDate: string, endDate: string) => {
    const response = await api.get("/student/attendance/range", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get attendance summary (overall statistics)
  getAttendanceSummary: async () => {
    const response = await api.get("/student/attendance/summary");
    return response.data;
  },

  // Get attendance for a specific course
  getCourseAttendance: async (courseId: string) => {
    const response = await api.get(`/student/attendance/course/${courseId}`);
    return response.data;
  },
};
