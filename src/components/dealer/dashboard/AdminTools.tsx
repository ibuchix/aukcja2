
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { usePendingDealers } from '@/hooks/admin/usePendingDealers';
import { PendingDealersList } from './admin/PendingDealersList';

export function AdminTools() {
  const { isAdmin, permissionsLoading } = usePermissions();
  const { 
    pendingDealers, 
    isLoading, 
    loadPendingDealers, 
    handleVerifyDealer, 
    handleRejectDealer 
  } = usePendingDealers();

  // Only show for admins
  if (!isAdmin || permissionsLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
          Admin Tools
        </CardTitle>
        <CardDescription>
          Manage dealer verifications and system settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PendingDealersList
          dealers={pendingDealers}
          isLoading={isLoading}
          onRefresh={loadPendingDealers}
          onVerify={handleVerifyDealer}
          onReject={handleRejectDealer}
        />
      </CardContent>
    </Card>
  );
}
