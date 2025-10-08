"use client";

import { AuthService, LoginCredentials } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Check if we're on a public route (login page)
  const isPublicRoute = pathname === "/login" || pathname === "/";

  const {
    data: user,
    isLoading: isLoadingUser,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: AuthService.getProfile,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized) or 403 (Forbidden)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry a maximum of 2 times for other errors
      return failureCount < 2;
    },
    // Don't refetch on window focus for auth status
    refetchOnWindowFocus: false,
    // Skip fetching on public routes like login
    enabled: !isPublicRoute,
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const result = await AuthService.login(credentials);
        return result;
      } catch (error) {
        console.error("Authentication error:", error);
        throw error; // Re-throw to be caught by the component
      }
    },
    onSuccess: async () => {
      // Wait for user data to be fetched before redirecting
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.refetchQueries({ queryKey: ["user"] });
      
      toast.success("Login successful");
      
      // Use router.refresh() to ensure middleware runs with new cookies
      router.refresh();
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      // Error will be handled in the component
    },
  });

  const logout = useMutation({
    mutationFn: AuthService.logout,
    onSettled: () => {
      // Clear all queries from cache
      queryClient.clear();
      // Navigate to login page
      router.push("/login");
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
    },
    onError: (error: any) => {
      console.error("Logout API call failed:", error);
      toast.error("Logout failed on server, clearing session locally.");

      // Clean up client side even if server request fails
      if (typeof window !== "undefined") {
        // Clear cookies manually as a fallback
        document.cookie =
          "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    },
  });

  // Only consider the user logged in if we have user data and no errors
  // If we're on a public route, we don't need to check this
  const isLoggedIn = isPublicRoute ? false : !!user && !isError;

  return {
    user,
    isLoadingUser,
    isLoggedIn,
    isError,
    error,
    login,
    logout,
    refetchUser: refetch,
  };
}
