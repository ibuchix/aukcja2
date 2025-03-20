
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

type EntityType = 'dealer' | 'car' | 'bid' | 'auction';
type ActionType = 'view' | 'create' | 'update' | 'delete' | 'manage';

interface PermissionGateProps {
  children: React.ReactNode;
  action: ActionType;
  entityType?: EntityType;
  entityId?: string;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render children based on user permissions
 */
export function PermissionGate({ 
  children, 
  action, 
  entityType, 
  entityId,
  fallback = null 
}: PermissionGateProps) {
  const { isAdmin, canView, canEdit, canDelete, permissionsLoading } = usePermissions({
    entityType,
    entityId
  });

  // While loading permissions, don't render anything to prevent flashing
  if (permissionsLoading) {
    return null;
  }

  // Admin can see/do everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check specific permissions
  let hasPermission = false;

  switch (action) {
    case 'view':
      hasPermission = canView(entityId, entityType);
      break;
    case 'update':
    case 'create':
      hasPermission = canEdit(entityId, entityType);
      break;
    case 'delete':
      hasPermission = canDelete(entityId, entityType);
      break;
    case 'manage':
      hasPermission = canEdit(entityId, entityType) && canDelete(entityId, entityType);
      break;
    default:
      hasPermission = false;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
