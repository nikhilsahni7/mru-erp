"use client";

import { AuthService } from "@/lib/auth";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      if (await AuthService.isAuthenticated()) {
        redirect("/dashboard");
      } else {
        redirect("/login");
      }
    };
    checkAuth();
  }, []);

  // Return a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
