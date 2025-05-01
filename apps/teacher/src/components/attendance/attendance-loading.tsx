import { Loader2 } from "lucide-react";

export function AttendanceLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <p className="mt-4 text-muted-foreground">Loading attendance sessions...</p>
    </div>
  );
}
