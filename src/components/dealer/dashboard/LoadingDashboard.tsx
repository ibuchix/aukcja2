
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome card skeleton - simplified */}
      <Skeleton className="h-24 w-full rounded-lg" />
      
      {/* Profile info section skeleton - simplified */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
      
      {/* Quick actions skeleton - simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      
      {/* Stats section skeleton - simplified */}
      <Skeleton className="h-40 w-full" />
    </div>
  );
};
