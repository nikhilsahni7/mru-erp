"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Bell, Book, Calendar, ChevronDown, ClipboardList, HelpCircle, LayoutDashboard, LogOut, Menu, MessageSquare, RefreshCw, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  isSidebarCollapsed: boolean;
}

const NavItem = ({ href, icon, title, isActive, isSidebarCollapsed }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary/10 group",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {icon}
      </div>
      <span className={cn("font-medium transition-opacity", isSidebarCollapsed ? "opacity-0 w-0" : "opacity-100")}>
        {title}
      </span>
    </Link>
  );
};

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

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

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
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex-col bg-card border-r border-border transition-all duration-300 flex",
          isSidebarOpen ? "w-64" : "w-[72px]",
          isMobileMenuOpen ? "left-0" : "-left-full lg:left-0"
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 w-full">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Book className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "font-semibold text-lg transition-opacity",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              MRU Faculty
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:flex hidden"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <ChevronDown className="h-4 w-4 rotate-90" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={toggleMobileMenu}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            title="Dashboard"
            isActive={pathname === "/dashboard"}
            isSidebarCollapsed={!isSidebarOpen}
          />
          <NavItem
            href="/dashboard/attendance"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Attendance"
            isActive={pathname.includes("/dashboard/attendance")}
            isSidebarCollapsed={!isSidebarOpen}
          />
          <NavItem
            href="/dashboard/schedule"
            icon={<Calendar className="h-5 w-5" />}
            title="Schedule"
            isActive={pathname.includes("/dashboard/schedule")}
            isSidebarCollapsed={!isSidebarOpen}
          />
          <NavItem
            href="/dashboard/messages"
            icon={<MessageSquare className="h-5 w-5" />}
            title="Messages"
            isActive={pathname.includes("/dashboard/messages")}
            isSidebarCollapsed={!isSidebarOpen}
          />
          <NavItem
            href="/dashboard/profile"
            icon={<UserIcon className="h-5 w-5" />}
            title="Profile"
            isActive={pathname.includes("/dashboard/profile")}
            isSidebarCollapsed={!isSidebarOpen}
          />
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border mt-auto">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              !isSidebarOpen && "justify-center px-0"
            )}
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        {/* Header */}
        <header className="h-16 border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="text-xl font-semibold hidden sm:block">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : pathname.includes("/dashboard/attendance")
                  ? "Attendance Management"
                  : pathname.includes("/dashboard/schedule")
                  ? "Class Schedule"
                  : pathname.includes("/dashboard/messages")
                  ? "Messages"
                  : pathname.includes("/dashboard/profile")
                  ? "Profile"
                  : ""}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <RefreshCw className="h-5 w-5" />
              </Button>
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden sm:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar.png" />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground">Teacher</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <UserIcon className="w-4 h-4 mr-2" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <UserIcon className="w-4 h-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
