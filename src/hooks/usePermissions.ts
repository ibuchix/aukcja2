
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

  // Check if user is admin based on profile
  useEffect(() => {
    if (!isLoading && profile) {
      setIsAdmin(profile.role === 'admin');
      setIsDealer(profile.role === 'dealer');
    }
  }, [isLoading, profile]);

  // Function to check if user can perform an action on an entity
  const checkPermission = useCallback(async (action: ActionType, entityType: EntityType, entityId: string) => {
    if (!isAuthenticated || !user) return false;
    
    // Admins can do anything
    if (isAdmin) return true;
    
    // Check using RPC call
    try {
      // Get current session
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        return false;
      }
      
      // Use fetch directly to call the RPC function since TypeScript doesn't know about our custom functions
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/can_perform_action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
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
      
      const data = await response.json();
      return !!data;
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
