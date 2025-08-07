
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { WonVehicles } from "@/components/dealer/WonVehicles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function WonVehiclesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
    <DashboardLayout title="Wygrane auta">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your won vehicles.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wygrane auta">
      <WonVehicles />
    </DashboardLayout>
  );
}
