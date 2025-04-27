"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  Loader2,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavItem({ href, icon, label, isActive, isCollapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      {icon}
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoadingUser, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userNameInitial = user?.name ? user.name[0] : "S";

  const navItems = [
    { href: "/dashboard", icon: <Home size={20} />, label: "Dashboard" },
    { href: "/dashboard/courses", icon: <BookOpen size={20} />, label: "Courses" },
    { href: "/dashboard/schedule", icon: <Calendar size={20} />, label: "Schedule" },
    { href: "/dashboard/attendance", icon: <User size={20} />, label: "Attendance" },
    { href: "/dashboard/fees", icon: <CreditCard size={20} />, label: "Fees" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="mr-2"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <Menu size={20} />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="MRU ERP Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-semibold">MRU ERP</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {isLoadingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : userNameInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                {logout.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 z-20 flex flex-col border-r bg-background transition-all ${
            isCollapsed ? "w-16" : "w-64"
          } ${
            isMobileSidebarOpen ? "left-0" : "-left-full"
          } md:left-0 md:static`}
        >
          <div className="flex h-16 items-center border-b px-4">
            <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
              <Image
                src="/logo.svg"
                alt="MRU ERP Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              {!isCollapsed && (
                <span className="font-semibold">MRU ERP</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto hidden md:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={pathname === item.href}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </nav>

          <div className="border-t p-2">
            <NavItem
              href="/dashboard/settings"
              icon={<Settings size={20} />}
              label="Settings"
              isActive={pathname === "/dashboard/settings"}
              isCollapsed={isCollapsed}
            />
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1">
          {/* Desktop Header */}
          <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b bg-background px-6 md:flex">
            <h1 className="text-xl font-semibold">
              {pathname === "/dashboard"
                ? ""
                : navItems.find((item) => pathname === item.href)?.label ||
                  "Dashboard"}
            </h1>

            <div className="flex items-center gap-4">
              <ThemeToggle />

              <Button variant="outline" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
                <span className="sr-only">Notifications</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {isLoadingUser ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : userNameInitial}
                      </AvatarFallback>
                    </Avatar>
                    {!isLoadingUser && (
                      <span className="font-medium">{user?.name || "Student"}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    {logout.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
