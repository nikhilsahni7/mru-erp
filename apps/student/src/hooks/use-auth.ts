"use client";

import { AuthService, LoginCredentials } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isLoadingUser,
    isError,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: AuthService.getProfile,
  });

  const login = useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Login successful");
      window.location.replace("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const logout = useMutation({
    mutationFn: AuthService.logout,
    onSettled: () => {
      queryClient.clear();
      router.push("/login");
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
    },
    onError: (error: any) => {
      console.error("Logout API call failed:", error);
      toast.error("Logout failed on server, clearing session locally.");
    },
  });

  const isLoggedIn = !!user && !isError;

  return {
    user,
    isLoadingUser,
    isLoggedIn,
    isError,
    error,
    login,
    logout,
  };
}
