
import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { performAdminAction } from '@/utils/permissionUtils';

export function AdminTools() {
  const { isAdmin, permissionsLoading } = usePermissions();
  const [pendingDealers, setPendingDealers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Only load data if user is admin
    if (isAdmin && !permissionsLoading) {
      loadPendingDealers();
    }
  }, [isAdmin, permissionsLoading]);

  const loadPendingDealers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select(`
          id, 
          dealership_name, 
          supervisor_name, 
          verification_status, 
          created_at,
          user_id
        `)
        .eq('verification_status', 'pending');

      if (error) throw error;
      setPendingDealers(data || []);
    } catch (error) {
      console.error('Error loading pending dealers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending dealers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDealer = async (dealerId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('User not authenticated');

      // For verify_dealer we need to use direct fetch since it's a custom RPC
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('No active session');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sdvakfhmoaoucmhbhwvy.supabase.co'}/rest/v1/rpc/verify_dealer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          p_dealer_id: dealerId,
          p_admin_id: userData.user.id,
          p_notes: 'Verified via admin dashboard'
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Log this action
      await performAdminAction(
        'verify',
        'dealer',
        dealerId,
        { action: 'verify', status: 'approved' }
      );

      toast({
        title: 'Success',
        description: 'Dealer has been verified',
        variant: 'default',
      });

      // Refresh the list
      loadPendingDealers();
    } catch (error) {
      console.error('Error verifying dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify dealer',
        variant: 'destructive',
      });
    }
  };

  const handleRejectDealer = async (dealerId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('User not authenticated');

      // For reject_dealer we need to use direct fetch since it's a custom RPC
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('No active session');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sdvakfhmoaoucmhbhwvy.supabase.co'}/rest/v1/rpc/reject_dealer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          p_dealer_id: dealerId,
          p_admin_id: userData.user.id,
          p_rejection_reason: 'Rejected via admin dashboard',
          p_notes: 'Information provided was insufficient'
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Log this action
      await performAdminAction(
        'reject',
        'dealer',
        dealerId,
        { action: 'reject', status: 'rejected' }
      );

      toast({
        title: 'Success',
        description: 'Dealer has been rejected',
        variant: 'default',
      });

      // Refresh the list
      loadPendingDealers();
    } catch (error) {
      console.error('Error rejecting dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject dealer',
        variant: 'destructive',
      });
    }
  };

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Pending Dealer Verifications ({pendingDealers.length})</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPendingDealers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {pendingDealers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending verifications.</p>
          ) : (
            <div className="space-y-3">
              {pendingDealers.map((dealer) => (
                <div key={dealer.id} className="border rounded-md p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{dealer.dealership_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {dealer.supervisor_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(dealer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerifyDealer(dealer.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRejectDealer(dealer.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
