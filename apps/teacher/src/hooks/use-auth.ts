"use client";

import { AuthService, LoginCredentials, User } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Check if we're on a public route (login page)
  const isPublicRoute = pathname === "/login" || pathname === "/";

  const profile = useQuery<User>({
    queryKey: ["user"],
    queryFn: AuthService.getProfile,
    retry: (failureCount: number, error: any) => {
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
    onSuccess: (data) => {
      // No need to check roles here since the teacher-specific endpoint already verifies role
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Login successful");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      console.error("Login error details:", error?.response?.data);

      // Get the error message
      const errorMessage = error?.response?.data?.message || "Login failed";

      // Check for the specific "Only teacher accounts can login" error
      if (
        errorMessage.includes("Only teacher accounts can login") ||
        errorMessage.includes("Only TEACHER accounts")
      ) {
        console.log("Student attempted to log in to teacher portal");
        toast.error(
          "Access denied: This portal is exclusively for faculty members."
        );
        router.push("/login?error=student_access");
      }
      // Check for other role/permission errors
      else if (
        error?.response?.status === 403 ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("permission")
      ) {
        toast.error(
          "Access denied: You do not have permission to access the teacher portal."
        );
        router.push("/login?error=unauthorized");
      }
      // Handle general errors
      else {
        toast.error(errorMessage);
      }
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
  const isLoggedIn = isPublicRoute ? false : !!profile.data && !profile.isError;

  return {
    user: profile.data,
    isLoadingUser: profile.isLoading,
    isLoggedIn,
    isError: profile.isError,
    error: profile.error,
    login,
    logout,
    profile,
    refetchUser: profile.refetch,
  };
}
