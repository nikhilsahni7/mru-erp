import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AttendanceHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  showCreateButton?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export function AttendanceHeader({
  title,
  description,
  showBackButton = false,
  showCreateButton = false,
  backHref,
  actions,
}: AttendanceHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6">
      <div className="space-y-1">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-3 text-muted-foreground"
            onClick={backHref ? undefined : () => router.back()}
            asChild={backHref ? true : false}
          >
            {backHref ? (
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {actions}
        {showCreateButton && (
          <Button asChild>
            <Link href="/dashboard/attendance/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
