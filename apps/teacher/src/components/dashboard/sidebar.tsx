import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Book, Calendar, ChevronDown, ClipboardList, LayoutDashboard, LogOut, MessageSquare, User, X } from "lucide-react";
import Link from "next/link";
import { NavItem } from "./nav-item";

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  pathname: string;
  onLogout: () => void;
}

export function Sidebar({
  isSidebarOpen,
  setSidebarOpen,
  isMobileMenuOpen,
  setMobileMenuOpen,
  pathname,
  onLogout
}: SidebarProps) {
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
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
            {isSidebarOpen ? (
              <ChevronDown className="h-4 w-4 rotate-90" />
            ) : (
              <ChevronDown className="h-4 w-4 -rotate-90" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
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
            icon={<User className="h-5 w-5" />}
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
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
