import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  isSidebarCollapsed: boolean;
}

export function NavItem({ href, icon, title, isActive, isSidebarCollapsed }: NavItemProps) {
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
}
