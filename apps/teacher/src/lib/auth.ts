import { ApiService } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";

export interface LoginCredentials {
  rollNo: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  rollNo?: string;
  branch?: string;
  phone?: string | null;
  clg?: string;
  avatar?: string;
  devices?: {
    ip: string;
    userAgent: string;
    loggedInAt: string;
  }[];
}

export interface AuthResponse {
  accessToken: string;
}

export interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
}

// Check if a document is available (browser environment)
const isBrowser = () => typeof window !== "undefined";

export const AuthService = {
  // Login a user with rollNo and password
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      console.log("Attempting teacher login with:", { rollNo: credentials.rollNo });

      // Use the teacher-specific login endpoint for the teacher app
      const response = await ApiService.teacherLogin(credentials);

      if (process.env.NODE_ENV !== "production") {
        console.log("Teacher login successful, response:", response.data);
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout the current user
  logout: async (): Promise<void> => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Get the current user's profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await ApiService.getProfile();
      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  isAuthenticated(): boolean {
    if (!isBrowser()) return false;

    // Check if we have an access token in cookies
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));

    if (!accessTokenCookie) return false;

    try {
      // If we have a token, verify it's not expired
      const token = accessTokenCookie.split('=')[1];
      const payload = jwtDecode<TokenPayload>(token);

      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        return false;
      }

      // Verify that the user has the TEACHER role
      if (payload.role !== "TEACHER") {
        console.error("Access denied: User does not have TEACHER role");
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Clear any locally stored auth state (refresh timers, etc.)
  clearRefreshState: (): void => {
    // Clear any timers or local state here if needed
  }
};
