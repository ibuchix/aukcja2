
import { supabase } from "@/integrations/supabase/client";
import { performAdminAction } from "@/utils/permissionUtils";

/**
 * Verify a dealer through the Supabase RPC
 */
export async function verifyDealer(dealerId: string, notes: string = 'Verified via admin dashboard'): Promise<boolean> {
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
        p_notes: notes
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

    return true;
  } catch (error) {
    console.error('Error verifying dealer:', error);
    return false;
  }
}

/**
 * Reject a dealer through the Supabase RPC
 */
export async function rejectDealer(
  dealerId: string, 
  rejectionReason: string = 'Rejected via admin dashboard',
  notes: string = 'Information provided was insufficient'
): Promise<boolean> {
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
        p_rejection_reason: rejectionReason,
        p_notes: notes
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

    return true;
  } catch (error) {
    console.error('Error rejecting dealer:', error);
    return false;
  }
}
