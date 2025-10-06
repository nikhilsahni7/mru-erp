import { api } from "@/lib/axios";

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


const isBrowser = () => typeof window !== "undefined";

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/student/login",
      credentials
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");

  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/user/profile");
    return response.data;
  },


  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  },
};
