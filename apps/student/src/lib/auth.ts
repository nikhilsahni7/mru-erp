import { api } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";

export interface LoginCredentials {
  rollNo: string;
  password: string;
}

export interface User {
  name: string | null;
  rollNo: string;
  branch: string;
  phone: string | null;
  clg: string;
  email: string | null;
  devices: {
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
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/student/login", credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    // The cookie will be cleared by the server response
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/user/profile");
    return response.data;
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

      return true;
    } catch (error) {
      return false;
    }
  },

  // Clear any refresh state (timers, cache, etc.)
  clearRefreshState(): void {
    // This function is called when manually logging out
    // Here we would clear any related state like refresh timers
    // Currently doesn't need to do anything as our refresh logic
    // is handled by axios interceptors
  }
};
