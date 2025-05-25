
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useDirectQueryTest(user: User | null, isAuthLoading: boolean) {
  const [directQueryResult, setDirectQueryResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const runDirectQueryTest = async () => {
      if (!user) return;
      
      try {
        console.log(`[Direct Query Test] Running test query for user: ${user.id}`);
        
        // Test 1: Try to get user's own profile via RPC
        const { data: userIdFromRpc, error: rpcError } = await supabase.rpc('debug_auth_user_id', {});
        
        if (rpcError) {
          console.error("[Direct Query Test] RPC test failed:", rpcError);
          setDirectQueryResult({
            success: false,
            message: `RPC test failed: ${rpcError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] RPC test succeeded:", userIdFromRpc);
        
        // Test 2: Try a simple count query with RLS protection
        const { count, error: countError } = await supabase
          .from('dealers')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error("[Direct Query Test] Count query failed:", countError);
          setDirectQueryResult({
            success: false,
            message: `Count query failed: ${countError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] Count query succeeded. Visible dealer rows:", count);
        
        // Test 3: Try to get specific fields from the dealer table
        const { data: nameData, error: nameError } = await supabase
          .from('dealers')
          .select('dealership_name, supervisor_name')
          .eq('user_id', user.id)
          .single();
          
        if (nameError) {
          console.error("[Direct Query Test] Name query failed:", nameError);
          setDirectQueryResult({
            success: false,
            message: `Name query failed: ${nameError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] Name query succeeded:", nameData);
        
        // All tests passed
        setDirectQueryResult({
          success: true,
          message: `All direct queries succeeded. User ID matches: ${userIdFromRpc === user.id}. Found ${count} dealer records visible to this user.`
        });
        
      } catch (error) {
        console.error("[Direct Query Test] Unexpected error:", error);
        setDirectQueryResult({
          success: false,
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    };
    
    if (user && !isAuthLoading) {
      runDirectQueryTest();
    }
  }, [user, isAuthLoading]);

  return directQueryResult;
}
