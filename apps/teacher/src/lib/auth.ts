import { ApiService } from "@/lib/axios";

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

const isBrowser = () => typeof window !== "undefined";

export const AuthService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      console.log("Attempting teacher login with:", {
        rollNo: credentials.rollNo,
      });

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

  logout: async (): Promise<void> => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await ApiService.getProfile();
      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      await ApiService.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  },
};
