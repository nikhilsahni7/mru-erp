import { Button } from "@/components/ui/button";

interface AttendanceErrorProps {
  onRetry: () => void;
}

export function AttendanceError({ onRetry }: AttendanceErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <p className="text-destructive font-medium">Failed to load attendance sessions</p>
      <p className="text-muted-foreground mt-2">Please try again later</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
