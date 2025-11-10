
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type EntityType = 'dealer' | 'car' | 'bid' | 'auction';
type ActionType = 'view' | 'create' | 'update' | 'delete' | 'manage';

interface UsePermissionsProps {
  entityId?: string;
  entityType?: EntityType;
}

export function usePermissions(props?: UsePermissionsProps) {
  const { entityId, entityType } = props || {};
  const { user, isAuthenticated, isLoading, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDealer, setIsDealer] = useState<boolean>(false);
  const [entityPermissions, setEntityPermissions] = useState<{[key: string]: boolean}>({});
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);

  // Check if user is admin/dealer using secure has_role RPC function
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!isLoading && user) {
        try {
          // Check admin role
          const { data: isAdminRole, error: adminError } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });
          
          if (adminError) {
            console.error("Error checking admin role:", adminError);
          } else {
            setIsAdmin(!!isAdminRole);
          }

          // Check dealer role
          const { data: isDealerRole, error: dealerError } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'dealer'
          });
          
          if (dealerError) {
            console.error("Error checking dealer role:", dealerError);
          } else {
            setIsDealer(!!isDealerRole);
          }
        } catch (err) {
          console.error("Error checking user roles:", err);
          // Reset to safe defaults on error
          setIsAdmin(false);
          setIsDealer(false);
        }
      } else if (!user) {
        // User logged out, reset roles
        setIsAdmin(false);
        setIsDealer(false);
      }
    };

    checkUserRoles();
  }, [isLoading, user]);

  // Function to check if user can perform an action on an entity
  const checkPermission = useCallback(async (action: ActionType, entityType: EntityType, entityId: string) => {
    if (!isAuthenticated || !user) return false;
    
    // Admins can do anything
    if (isAdmin) return true;
    
    // Check using RPC call
    try {
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        return false;
      }
      
      // Use fetch directly to call the RPC function since TypeScript doesn't know about our custom functions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/can_perform_action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          p_action: action,
          p_entity_type: entityType,
          p_entity_id: entityId
        })
      });
      
      if (!response.ok) {
        console.error("Permission check error:", await response.text());
        return false;
      }
      
      const responseData = await response.json();
      return !!responseData;
    } catch (err) {
      console.error("Error checking permissions:", err);
      return false;
    }
  }, [isAuthenticated, user, isAdmin]);

  // Load entity specific permissions if entityId is provided
  useEffect(() => {
    const loadEntityPermissions = async () => {
      if (!entityId || !entityType || !isAuthenticated || isAdmin) return;
      
      setPermissionsLoading(true);
      
      try {
        // For each action type, check permission
        const permissions = {};
        for (const action of ['view', 'create', 'update', 'delete', 'manage'] as ActionType[]) {
          permissions[action] = await checkPermission(action, entityType, entityId);
        }
        
        setEntityPermissions(permissions);
      } catch (err) {
        console.error("Error loading entity permissions:", err);
      } finally {
        setPermissionsLoading(false);
      }
    };
    
    loadEntityPermissions();
  }, [entityId, entityType, isAuthenticated, isAdmin, checkPermission]);

  // Utility functions for common permission checks
  const canView = useCallback((specificEntityId?: string, specificEntityType?: EntityType) => {
    if (isAdmin) return true;
    
    const eid = specificEntityId || entityId;
    const etype = specificEntityType || entityType;
    
    if (!eid || !etype) return isAuthenticated;
    
    return entityPermissions['view'] ?? false;
  }, [isAdmin, entityId, entityType, entityPermissions, isAuthenticated]);

  const canEdit = useCallback((specificEntityId?: string, specificEntityType?: EntityType) => {
    if (isAdmin) return true;
    
    const eid = specificEntityId || entityId;
    const etype = specificEntityType || entityType;
    
    if (!eid || !etype) return false;
    
    return entityPermissions['update'] ?? false;
  }, [isAdmin, entityId, entityType, entityPermissions]);

  const canDelete = useCallback((specificEntityId?: string, specificEntityType?: EntityType) => {
    if (isAdmin) return true;
    
    const eid = specificEntityId || entityId;
    const etype = specificEntityType || entityType;
    
    if (!eid || !etype) return false;
    
    return entityPermissions['delete'] ?? false;
  }, [isAdmin, entityId, entityType, entityPermissions]);

  return {
    isAdmin,
    isDealer,
    permissionsLoading,
    canView,
    canEdit,
    canDelete,
    checkPermission,
    entityPermissions,
  };
}
