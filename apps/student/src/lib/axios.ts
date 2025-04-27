import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Add a timeout to prevent hanging requests
  timeout: 10000, // 10 seconds
});

// Track if we're currently refreshing to prevent multiple refresh requests
let isRefreshing = false;
// Queue of requests to retry after token refresh
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to process the queue of failed requests
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Helper to determine if we're on the login page
const isLoginPage = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/login' || window.location.pathname === '/';
};

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Add detailed logging for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else if (error.request) {
      console.error('API Request Error (No Response):', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      console.error('API Error Setup:', error.message);
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If we can't access the request config, just reject
    if (!originalRequest) return Promise.reject(error);

    // Don't retry these endpoints to avoid infinite loops
    const noRetryEndpoints = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/student/login', '/auth/teacher/login'];
    if (noRetryEndpoints.some(endpoint => originalRequest.url?.includes(endpoint))) {
      return Promise.reject(error);
    }

    // Skip refresh attempts if we're on the login page
    if (isLoginPage()) {
      return Promise.reject(error);
    }

    // If the error is due to an expired token (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark this request as retried
      originalRequest._retry = true;

      // If we're not already refreshing, try to refresh the token
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Attempt to refresh the token - this will update the HTTP-only cookie
          const refreshResponse = await api.post("/auth/refresh");
          const newToken = refreshResponse.data.accessToken;

          // Notify all subscribers that we have a new token
          onRefreshed(newToken);
          isRefreshing = false;

          // Add the new token to the original request (although it's in cookies, some APIs might still check headers)
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          }

          // Retry the original request with the new token
          return api(originalRequest);
        } catch (refreshError: any) {
          isRefreshing = false;

          // Clear the queue on failure
          refreshSubscribers = [];

          // Don't show error toast or redirect if we're already on the login page
          if (!isLoginPage()) {
            // Show user-friendly message based on the error
            const errorMessage = refreshError?.response?.data?.message || "Session expired, please login again";
            toast.error(errorMessage);

            // Redirect to login after a short delay so user can see the message
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/login";
              }, 1500);
            }
          }

          return Promise.reject(refreshError);
        }
      } else {
        // If we are already refreshing, add this request to the queue
        return new Promise(resolve => {
          refreshSubscribers.push((token: string) => {
            // Add the new token to the original request
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }
    }

    // For other errors, just pass through
    return Promise.reject(error);
  }
);
