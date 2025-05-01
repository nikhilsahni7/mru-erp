"use client";

import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logout, profile } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get user initials for avatar fallback
  const userInitials = profile?.data?.name
    ? profile.data.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "MR";

  const userName = profile?.data?.name || "Faculty Member";

  return (
    <div className="min-h-screen bg-background relative flex">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        pathname={pathname}
        onLogout={() => logout.mutate()}
      />

      {/* Main content area */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        <Header
          userName={userName}
          userRole="Teacher"
          userInitials={userInitials}
          pathname={pathname}
          onToggleMobileMenu={toggleMobileMenu}
          onLogout={() => logout.mutate()}
        />

        {/* Main content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
